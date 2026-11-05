import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import React from 'react';
import { create } from 'react-test-renderer';

const require = createRequire(import.meta.url);
require.extensions['.css'] = module => { module.exports = {}; };
Object.assign(globalThis, { React });

test('every product scene uses the requested language and native capture dimensions', async () => {
  const { ProductScene } = await import('../ProductScene');
  const scenes = [
    { kind: 'hero', products: ['repository', 'suites'] },
    { kind: 'coverage', products: ['repository', 'suites'] },
    { kind: 'execution', products: ['dashboard', 'run'] },
    { kind: 'integrations', products: ['integrations', 'codex'] },
  ] as const;
  for (const locale of ['en', 'ru'] as const) for (const { kind, products } of scenes) {
    const tree = create(<ProductScene kind={kind} locale={locale} />);
    try {
      const images = tree.root.findAllByType('img');
      assert.deepEqual(images.map(image => image.props.src), products.map(product =>
        `/falcon/landing/2026-11/${locale}/product-${product}.webp`));
      for (const image of images) {
        assert.equal(image.props.width, 3456);
        assert.equal(image.props.height, 2234);
        assert.ok(image.props.alt);
      }
      assert.equal(images[0].props.loading, kind === 'hero' ? 'eager' : 'lazy');
      assert.equal(images[1].props.loading, 'lazy');
    } finally { tree.unmount(); }
  }
});
