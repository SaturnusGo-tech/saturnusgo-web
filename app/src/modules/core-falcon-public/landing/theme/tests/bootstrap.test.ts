import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { landingThemeBootstrap, landingThemeKey, resolveLandingTheme } from '../model';

test('the pre-paint bootstrap applies the saved landing theme before rendering content', () => {
  for (const saved of [null, 'dark', 'light', 'invalid', 'system', 'LIGHT']) {
    const attributes = new Map<string, string>();
    const reads: string[] = [];
    runInNewContext(landingThemeBootstrap, {
      localStorage: { getItem(key: string) { reads.push(key); return saved; } },
      document: { documentElement: { setAttribute(name: string, value: string) { attributes.set(name, value); } } },
    });
    assert.deepEqual(reads, [landingThemeKey]);
    assert.equal(attributes.get('data-falcon-landing-theme'), resolveLandingTheme(saved));
  }
});

test('the landing still receives a deterministic dark first paint when storage is unavailable', () => {
  for (const blockedStorage of [undefined, { getItem() { throw new Error('Storage blocked'); } }]) {
    const attributes = new Map<string, string>();
    runInNewContext(landingThemeBootstrap, {
      localStorage: blockedStorage,
      document: { documentElement: { setAttribute(name: string, value: string) { attributes.set(name, value); } } },
    });
    assert.equal(attributes.get('data-falcon-landing-theme'), 'dark');
  }
});
