import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { getStoryPhase } from '../change-story';
import { useChangeStory } from '../useChangeStory';

type Story = ReturnType<typeof useChangeStory>;

function setup(t: TestContext, reduced = false) {
  let now = 0;
  let nextFrame = 0;
  let renders = 0;
  let story!: Story;
  let renderer!: ReactTestRenderer;
  const frames = new Map<number, FrameRequestCallback>();
  const visibilityListeners = new Set<() => void>();
  const focusListeners = { blur: new Set<() => void>(), focus: new Set<() => void>() };
  const preferenceListeners = new Set<() => void>();
  const observers: Observer[] = [];
  const element = {} as HTMLDivElement;
  const document = {
    hidden: false,
    addEventListener(name: string, listener: () => void) {
      if (name === 'visibilitychange') visibilityListeners.add(listener);
    },
    removeEventListener(name: string, listener: () => void) {
      if (name === 'visibilitychange') visibilityListeners.delete(listener);
    },
  };
  const preference = {
    matches: reduced,
    addEventListener(_name: string, listener: () => void) { preferenceListeners.add(listener); },
    removeEventListener(_name: string, listener: () => void) { preferenceListeners.delete(listener); },
  };
  class Observer implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0, 0.35];
    disconnected = false;
    target: Element | null = null;
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe(target: Element) { this.target = target; }
    unobserve(target: Element) { if (this.target === target) this.target = null; }
    takeRecords() { return []; }
    disconnect() { this.target = null; this.disconnected = true; }
  }
  const window = {
    addEventListener(name: 'blur' | 'focus', listener: () => void) { focusListeners[name].add(listener); },
    removeEventListener(name: 'blur' | 'focus', listener: () => void) { focusListeners[name].delete(listener); },
    matchMedia: () => preference,
    performance: { now: () => now },
    IntersectionObserver: Observer,
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  };
  const globals = { window, document, IntersectionObserver: Observer };
  const originals = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, globals);
  function Harness() {
    renders++;
    story = useChangeStory();
    story.ref.current = element;
    return null;
  }
  act(() => { renderer = create(createElement(Harness) as unknown as Parameters<typeof create>[0]); });
  let mounted = true;
  const unmount = () => { if (mounted) act(() => { renderer.unmount(); mounted = false; }); };
  t.after(() => {
    unmount();
    for (const key of Object.keys(globals)) {
      if (originals[key]) Object.defineProperty(globalThis, key, originals[key]);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return {
    get story() { return story; },
    get renders() { return renders; },
    frames, observers, visibilityListeners, focusListeners, preferenceListeners, unmount,
    frame(timestamp: number) {
      now = timestamp;
      const callbacks = [...frames.values()];
      frames.clear();
      act(() => { callbacks.forEach(callback => callback(timestamp)); });
    },
    visible(ratio: number) {
      act(() => {
        const bounds: DOMRectReadOnly = { x: 0, y: 0, top: 0, right: 100, bottom: 100, left: 0,
          width: 100, height: 100, toJSON: () => ({}) };
        const entry: IntersectionObserverEntry = { target: element, isIntersecting: ratio > 0,
          intersectionRatio: ratio, time: now, rootBounds: bounds,
          boundingClientRect: bounds, intersectionRect: bounds };
        for (const observer of observers) {
          observer.callback([entry], observer);
        }
      });
    },
    hidden(value: boolean) {
      document.hidden = value;
      act(() => { visibilityListeners.forEach(listener => listener()); });
    },
    focus(value: boolean) {
      act(() => { focusListeners[value ? 'focus' : 'blur'].forEach(listener => listener()); });
    },
    reduce(value: boolean) {
      preference.matches = value;
      act(() => { preferenceListeners.forEach(listener => listener()); });
    },

  };
}

test('the server renders the first prompt without browser globals', () => {
  let story!: Story;
  function ServerStory() { story = useChangeStory(); return createElement('span', null, story.elapsed); }
  assert.equal(renderToString(createElement(ServerStory)), '<span>0</span>');
  assert.equal(story.time.get(), 0);
  assert.equal(story.running, false);
});

test('phase boundaries clamp to the first and last story scenes', () => {
  const examples = [
    [-500, 'prompt'], [0, 'prompt'], [3199, 'prompt'], [3200, 'context'],
    [8499, 'context'], [9500, 'cases'], [13499, 'cases'], [15500, 'guide'],
    [18499, 'guide'], [22000, 'browser'], [33000, 'browser'], [43999, 'browser'],
    [44000, 'finale'], [50000, 'finale'], [84999, 'finale'],
    [Number.NaN, 'prompt'], [Number.NEGATIVE_INFINITY, 'prompt'], [Number.POSITIVE_INFINITY, 'finale'],
  ] as const;
  for (const [time, phase] of examples) assert.equal(getStoryPhase(time), phase, `phase at ${time} ms`);
});

test('waits for 35% visibility and publishes smooth time without a React render every frame', t => {
  const h = setup(t);
  assert.equal(h.story.time.get(), 0);
  assert.equal(h.frames.size, 0);
  h.visible(0.34);
  h.frame(1000);
  assert.equal(h.story.time.get(), 0);
  h.visible(0.35);
  assert.equal(h.story.running, true);
  const renders = h.renders;
  for (const timestamp of [1016, 1032, 1048, 1064, 1080, 1096]) h.frame(timestamp);
  assert.equal(h.story.time.get(), 96);
  assert.equal(h.story.elapsed, 0);
  assert.equal(h.renders, renders);
  h.frame(1112);
  assert.equal(h.story.elapsed, 112);
  assert.equal(h.renders, renders + 1);
});

test('leaving the scene or hiding the tab restarts the presentation on return', t => {
  const h = setup(t);
  h.visible(0.5);
  h.frame(120);
  h.visible(0);
  assert.equal(h.story.running, false);
  assert.equal(h.frames.size, 0);
  h.frame(10000);
  assert.equal(h.story.time.get(), 120);
  h.visible(0.5);
  assert.equal(h.story.time.get(), 0);
  assert.equal(h.story.elapsed, 0);
  h.frame(10016);
  assert.equal(h.story.time.get(), 16);
  h.hidden(true);
  h.frame(20000);
  assert.equal(h.story.time.get(), 16);
  assert.equal(h.story.running, false);
  h.hidden(false);
  assert.equal(h.story.time.get(), 0);
  h.frame(20020);
  assert.equal(h.story.time.get(), 20);
});


test('the initial visibility threshold does not pause a started story that is still onscreen', t => {
  const h = setup(t);
  h.visible(0.35);
  h.frame(100);
  h.visible(0.1);
  h.frame(120);
  assert.equal(h.story.time.get(), 120);
  assert.equal(h.story.running, true);
  h.visible(0);
  h.frame(10000);
  h.visible(0.1);
  h.frame(10016);
  assert.equal(h.story.time.get(), 120);
  assert.equal(h.story.running, false);
  h.visible(0.35);
  assert.equal(h.story.time.get(), 0);
  h.frame(10032);
  assert.equal(h.story.time.get(), 16);
});

test('window focus and tab visibility restart once, only after the scene is active', t => {
  const h = setup(t);
  h.visible(0.5);
  h.frame(150);
  h.focus(false);
  h.hidden(true);
  h.frame(1000);
  assert.equal(h.story.running, false);
  assert.equal(h.story.time.get(), 150);
  h.focus(true);
  assert.equal(h.story.time.get(), 150, 'focus alone cannot play a hidden tab');
  h.hidden(false);
  assert.equal(h.story.time.get(), 0);
  assert.equal(h.story.elapsed, 0);
  h.frame(1016);
  h.focus(true);
  h.hidden(false);
  h.visible(0.5);
  assert.equal(h.story.time.get(), 16, 'duplicate active events do not reset the clock');
  assert.equal(h.frames.size, 1);
  h.visible(0);
  h.focus(false);
  h.frame(5000);
  h.focus(true);
  assert.equal(h.story.time.get(), 16, 'returning to the window while offscreen stays stopped');
  assert.equal(h.story.running, false);
  h.visible(0.5);
  h.frame(5016);
  assert.equal(h.story.time.get(), 16);
});


test('holds the ending while visible and replays after leaving and returning', t => {
  const h = setup(t);
  h.visible(0.5);
  h.frame(49990);
  h.frame(50016);
  assert.equal(h.story.time.get(), 50000);
  assert.equal(h.story.elapsed, 50000);
  assert.equal(h.story.running, false);
  assert.equal(h.frames.size, 0);
  h.frame(90000);
  h.visible(0.5);
  h.focus(true);
  assert.equal(h.story.time.get(), 50000);
  assert.equal(h.frames.size, 0);
  h.visible(0);
  h.visible(0.5);
  assert.equal(h.story.time.get(), 0);
  assert.equal(h.story.running, true);
  h.frame(90016);
  assert.equal(h.story.time.get(), 16);
});

test('reduced motion stays static when viewport, tab and window focus return', t => {
  const h = setup(t, true);
  assert.equal(h.story.reducedMotion, true);
  assert.equal(h.story.time.get(), 50000);
  assert.equal(h.story.elapsed, 50000);
  h.visible(0.5);
  h.visible(0);
  h.focus(false);
  h.hidden(true);
  h.visible(0.5);
  h.hidden(false);
  h.focus(true);
  assert.equal(h.story.time.get(), 50000);
  assert.equal(h.story.running, false);
  assert.equal(h.frames.size, 0);
  h.reduce(false);
  assert.equal(h.story.time.get(), 50000);
  h.visible(0);
  h.visible(0.5);
  h.frame(100);
  assert.equal(h.story.time.get(), 100);
  h.reduce(true);
  assert.equal(h.story.time.get(), 50000);
  assert.equal(h.story.running, false);
});

test('unmount releases the observer, listeners and frame, including an already queued callback', t => {
  const h = setup(t);
  h.visible(0.5);
  h.frame(150);
  const queued = [...h.frames.values()][0];
  const time = h.story.time;
  h.unmount();
  assert.equal(h.frames.size, 0);
  assert.equal(h.visibilityListeners.size, 0);
  assert.equal(h.preferenceListeners.size, 0);
  assert.equal(h.focusListeners.blur.size, 0);
  assert.equal(h.focusListeners.focus.size, 0);
  assert.ok(h.observers.every(observer => observer.disconnected));
  act(() => queued(20000));
  assert.equal(time.get(), 150);
  assert.equal(h.frames.size, 0);
});
