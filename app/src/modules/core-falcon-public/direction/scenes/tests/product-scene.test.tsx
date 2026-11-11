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
    { kind: 'documentation', products: ['docs', 'docs-overview'] },
  ] as const;
  for (const locale of ['en', 'ru'] as const) for (const { kind, products } of scenes) {
    const tree = create(<ProductScene kind={kind} locale={locale} />);
    try {
      for (const theme of ['dark', 'light']) {
        const plane = tree.root.findByProps({ 'data-product-theme': theme });
        const images = plane.findAllByType('img');
        assert.deepEqual(images.map(image => image.props.src), products.map(product =>
          `/falcon/landing/2026-11/themes/${theme}/${locale}/product-${product}.webp`));
        assert.deepEqual(images.map(image => [image.props.width, image.props.height]), [[3456, 2234], [3456, 2234]]);
        for (const image of images) {
          assert.ok(image.props.alt);
          assert.equal(image.props.loading, kind === 'hero' ? 'eager' : 'lazy');
        }
        assert.ok(plane.findAllByType('source').every(source => source.props.srcSet.includes(`/${theme}/${locale}/`)));
      }
    } finally { tree.unmount(); }
  }
});
