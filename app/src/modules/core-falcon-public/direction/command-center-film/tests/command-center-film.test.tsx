import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';

const require = createRequire(import.meta.url);
require.extensions['.css'] = module => { module.exports = {}; };
Object.assign(globalThis, { React });

test('landing film defers loading, validates messages, keeps time on preference changes and replays on return', async () => {
  const observers: Array<{ options?: IntersectionObserverInit; emit: (ratio: number) => void }> = [];
  const sent: Array<{ type: string; active: boolean; restart: boolean; theme: string; locale: string; reducedMotion: boolean }> = [];
  const browser = Object.assign(new EventTarget(), {
    location: { origin: 'http://127.0.0.1:4665' },
    matchMedia: () => Object.assign(new EventTarget(), { matches: false }),
  });
  const page = Object.assign(new EventTarget(), { hidden: false });
  const frameWindow = { postMessage: (message: typeof sent[number], origin: string) => {
    assert.equal(origin, browser.location.origin);
    sent.push(message);
  } };
  const previous = { window: globalThis.window, document: globalThis.document, observer: globalThis.IntersectionObserver };
  class Observer {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      observers.push({ options, emit: ratio => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver) });
    }
    observe() {}
    disconnect() {}
  }
  Object.assign(globalThis, { window: browser, document: page, IntersectionObserver: Observer });
  const { CommandCenterFilm } = await import('../CommandCenterFilm');
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<CommandCenterFilm locale="en" theme="dark" ready />, {
    createNodeMock: element => element.type === 'iframe' ? { contentWindow: frameWindow } : {},
  }); });
  const signal = (origin: string, source: unknown) => {
    const event = Object.assign(new Event('message'), { origin, source, data: { type: 'falcon-film:ready' } });
    act(() => { browser.dispatchEvent(event); });
  };
  try {
    assert.equal(tree!.root.findAllByType('iframe').length, 0, 'do not load a distant film');
    const preload = observers.find(observer => observer.options?.rootMargin)!;
    const playback = observers.find(observer => observer.options?.threshold)!;
    act(() => preload.emit(0.1));
    const src = tree!.root.findByType('iframe').props.src;
    assert.match(src, /theme=dark&lang=en/);
    signal('https://untrusted.example', frameWindow);
    signal(browser.location.origin, {});
    assert.equal(sent.length, 0, 'ignore another origin and another frame');
    signal(browser.location.origin, frameWindow);
    assert.equal(sent[sent.length - 1]?.active, false, 'preloaded film remains paused');
    act(() => playback.emit(0.6));
    assert.equal(sent[sent.length - 1]?.active, true);
    assert.equal(sent[sent.length - 1]?.restart, true);
    act(() => tree!.update(<CommandCenterFilm locale="ru" theme="light" ready />));
    assert.equal(tree!.root.findByType('iframe').props.src, src, 'preferences never navigate the iframe');
    assert.equal(sent[sent.length - 1]?.theme, 'light');
    assert.equal(sent[sent.length - 1]?.locale, 'ru');
    assert.equal(sent[sent.length - 1]?.restart, false, 'preserve current scene while switching preferences');
    act(() => playback.emit(0));
    assert.equal(sent[sent.length - 1]?.active, false);
    act(() => playback.emit(0.7));
    assert.equal(sent[sent.length - 1]?.restart, true, 'new visit replays from the prompt');
    act(() => { browser.dispatchEvent(new Event('blur')); });
    assert.equal(sent[sent.length - 1]?.active, false);
    act(() => { browser.dispatchEvent(new Event('focus')); });
    assert.equal(sent[sent.length - 1]?.active, true);
    assert.equal(sent[sent.length - 1]?.restart, true);
    act(() => tree!.unmount());
    const count = sent.length;
    signal(browser.location.origin, frameWindow);
    assert.equal(sent.length, count, 'remove bridge listeners on unmount');
  } finally {
    Object.assign(globalThis, { window: previous.window, document: previous.document, IntersectionObserver: previous.observer });
  }
});
