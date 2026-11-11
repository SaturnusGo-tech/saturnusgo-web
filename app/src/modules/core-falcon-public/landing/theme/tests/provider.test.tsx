import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { landingThemeKey, type LandingTheme } from '../model';

const require = createRequire(import.meta.url);
const attribute = 'data-falcon-landing-theme';
type State = { theme: LandingTheme; ready: boolean; toggle: () => void };

async function browserHarness(saved: string | null, initialAttribute: string | null = null, blocked = false) {
  const attributes = new Map<string, string>();
  if (initialAttribute !== null) attributes.set(attribute, initialAttribute);
  const storage = new Map<string, string>();
  if (saved !== null) storage.set(landingThemeKey, saved);
  const browser = new EventTarget();
  const descriptors = new Map(['React', 'window', 'document', 'localStorage'].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const previousCss = require.extensions['.css'];
  require.extensions['.css'] = module => { module.exports = {}; };
  // The preference provider is independent of the dynamically loaded HeroUI
  // controls; this harness exercises only its document and storage lifecycle.
  const { LandingThemeProvider, useLandingTheme } = await import('../LandingTheme');
  Object.assign(globalThis, {
    React,
    window: browser,
    document: { documentElement: {
      getAttribute(name: string) { return attributes.get(name) ?? null; },
      setAttribute(name: string, value: string) { attributes.set(name, value); },
      removeAttribute(name: string) { attributes.delete(name); },
    } },
    localStorage: {
      getItem(key: string) { if (blocked) throw new Error('Storage blocked'); return storage.get(key) ?? null; },
      setItem(key: string, value: string) { if (blocked) throw new Error('Storage blocked'); storage.set(key, value); },
    },
  });
  let state!: State;
  let view: ReactTestRenderer | undefined;
  const mountedViews = new Set<ReactTestRenderer>();
  function Probe() { state = useLandingTheme(); return null; }
  return {
    attributes, storage,
    get state() { return state; },
    async mount() { await act(async () => { view = create(<LandingThemeProvider><Probe /></LandingThemeProvider>); mountedViews.add(view); }); },
    async mountOverlappingProvider() {
      let overlappingState!: State;
      let overlappingView!: ReactTestRenderer;
      function OverlappingProbe() { overlappingState = useLandingTheme(); return null; }
      await act(async () => {
        overlappingView = create(<LandingThemeProvider><OverlappingProbe /></LandingThemeProvider>);
        mountedViews.add(overlappingView);
      });
      return {
        get state() { return overlappingState; },
        async unmount() { await act(async () => { overlappingView.unmount(); mountedViews.delete(overlappingView); }); },
      };
    },
    async toggle() { await act(async () => { state.toggle(); }); },
    async externalChange(value: string | null, key = landingThemeKey) {
      if (value === null) storage.delete(key); else storage.set(key, value);
      await act(async () => { browser.dispatchEvent(Object.assign(new Event('storage'), { key, newValue: value })); });
    },
    async unmount() { await act(async () => { if (view) { view.unmount(); mountedViews.delete(view); view = undefined; } }); },
    async restore() {
      await act(async () => { for (const mounted of mountedViews) mounted.unmount(); mountedViews.clear(); });
      if (previousCss) require.extensions['.css'] = previousCss; else delete require.extensions['.css'];
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test('client navigation restores a saved light theme even when no bootstrap attribute exists', async () => {
  const browser = await browserHarness('light');
  try {
    await browser.mount();
    assert.equal(browser.state.ready, true);
    assert.equal(browser.state.theme, 'light');
    assert.equal(browser.attributes.get(attribute), 'light');
    await browser.unmount();
    assert.equal(browser.attributes.has(attribute), false);
  } finally { await browser.restore(); }
});

test('theme changes persist across remounts and synchronize with other tabs without changing workspace preferences', async () => {
  const browser = await browserHarness('dark', 'dark');
  try {
    browser.storage.set('sg-theme', 'dark');
    await browser.mount();
    await browser.toggle();
    assert.equal(browser.state.theme, 'light');
    assert.equal(browser.attributes.get(attribute), 'light');
    assert.equal(browser.storage.get(landingThemeKey), 'light');
    assert.equal(browser.storage.get('sg-theme'), 'dark');
    await browser.unmount();
    assert.equal(browser.attributes.get(attribute), 'dark');
    await browser.mount();
    assert.equal(browser.state.theme, 'light');
    await browser.externalChange('dark');
    assert.equal(browser.state.theme, 'dark');
    await browser.externalChange('light', 'unrelated-key');
    assert.equal(browser.state.theme, 'dark');
    await browser.externalChange('light');
    assert.equal(browser.state.theme, 'light');
    await browser.externalChange(null);
    assert.equal(browser.state.theme, 'dark');
    await browser.unmount();
    await browser.externalChange('light');
    assert.equal(browser.attributes.get(attribute), 'dark');
  } finally { await browser.restore(); }
});

test('blocked storage preserves the pre-painted theme and still permits session theme switching', async () => {
  const browser = await browserHarness(null, 'light', true);
  try {
    await browser.mount();
    assert.equal(browser.state.theme, 'light');
    await browser.toggle();
    assert.equal(browser.state.theme, 'dark');
    assert.equal(browser.attributes.get(attribute), 'dark');
    await browser.unmount();
    assert.equal(browser.attributes.get(attribute), 'light');
  } finally { await browser.restore(); }
});

test('a departing landing route cannot restore an old theme over a newer mounted route', async () => {
  const browser = await browserHarness('light', 'light');
  try {
    await browser.mount();
    await browser.toggle();
    const nextRoute = await browser.mountOverlappingProvider();
    assert.equal(nextRoute.state.theme, 'dark');
    await browser.unmount();
    assert.equal(browser.attributes.get(attribute), 'dark');
    assert.equal(browser.storage.get(landingThemeKey), 'dark');
    await nextRoute.unmount();
    assert.equal(browser.attributes.get(attribute), 'light');
  } finally { await browser.restore(); }
});

test('overlapping providers restore the original document attribute only after both leave', async () => {
  const browser = await browserHarness('dark');
  try {
    await browser.mount();
    const nextRoute = await browser.mountOverlappingProvider();
    await nextRoute.unmount();
    assert.equal(browser.attributes.get(attribute), 'dark');
    await browser.unmount();
    assert.equal(browser.attributes.has(attribute), false);
  } finally { await browser.restore(); }
});
