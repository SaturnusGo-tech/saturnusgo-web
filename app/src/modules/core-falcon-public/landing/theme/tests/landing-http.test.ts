import assert from 'node:assert/strict';
import test from 'node:test';

// Run against the real Next preview; plain React SSR does not exercise Next's
// client-module bundling, where HeroUI overlays previously broke prerendering.
const origin = process.env.FALCON_LANDING_SSR_TEST_URL;
for (const [path, locale] of [['/', 'en'], ['/ru/', 'ru']] as const) {
  test(`the ${locale} landing returns complete server-rendered HTML`, { skip: !origin, timeout: 60_000 }, async () => {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(55_000) });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="direction-title"/);
    assert.doesNotMatch(html, /id="workflow(?:-title)?"/);
    assert.match(html, /id="documentation-title"/);
    assert.match(html, /id="landing-menu"[^>]*inert=""/, 'the closed mobile navigation must retain its native inert attribute');
    assert.doesNotMatch(html, /Element type is invalid|SSR providers only|SSR import free/);
  });
}
