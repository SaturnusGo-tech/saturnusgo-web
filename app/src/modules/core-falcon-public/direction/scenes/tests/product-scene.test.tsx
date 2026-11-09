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
      const images = tree.root.findAllByType('img');
      assert.deepEqual(images.map(image => image.props.src), products.map(product =>
        `/falcon/landing/2026-11/${locale}/product-${product}.webp${product === 'docs' ? '?v=20261110' : ''}`));
      assert.deepEqual(images.map(image => [image.props.width, image.props.height]),
        kind === 'documentation' ? [[2000, 1293], [1728, 1117]] : [[3456, 2234], [3456, 2234]]);
      for (const image of images) assert.ok(image.props.alt);
      if (kind === 'documentation') {
        const [mobileSource] = tree.root.findAllByType('source');
        assert.equal(mobileSource.props.srcSet, `/falcon/landing/2026-11/${locale}/product-docs-1152.webp?v=20261110`);
        assert.equal(mobileSource.props.width, 1152);
        assert.equal(mobileSource.props.height, 1024);
      }
      assert.equal(images[0].props.loading, kind === 'hero' ? 'eager' : 'lazy');
      assert.equal(images[1].props.loading, kind === 'hero' ? 'eager' : 'lazy');
    } finally { tree.unmount(); }
  }
});
