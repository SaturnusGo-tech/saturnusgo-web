import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import { requiredPublicAssets } from '../../route-manifest.mjs';

const ids = ['mika', 'nora', 'ray', 'ada', 'leo', 'lina', 'omar', 'zoe', 'finn', 'maya',
  'kai', 'iris', 'hugo', 'vera', 'ivo', 'yuna', 'sam', 'eva', 'elias', 'ayla'];

test('all 20 approved avatar cutouts have alpha, are required, unique, and within the image budget', async () => {
  const root = new URL('../../../../../public/falcon/avatars/v2/', import.meta.url);
  const files = (await readdir(root)).filter(file => file.endsWith('.webp'));
  assert.deepEqual(files.sort(), ids.map(id => `${id}.webp`).sort());
  const hashes = new Set();
  let total = 0;
  for (const id of ids) {
    assert.ok(requiredPublicAssets.includes(`/falcon/avatars/v2/${id}.webp`), `${id} must be checked before publishing`);
    const bytes = await readFile(new URL(`${id}.webp`, root));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.hasAlpha, true, `${id} must have real alpha, not a painted backdrop`);
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let pixel = 3; pixel < data.length; pixel += info.channels) if (data[pixel] === 0) transparent++;
    assert.ok(transparent > 40_000, `${id} background must be fully removed`);
    for (const corner of [3, 511 * 4 + 3, 511 * 512 * 4 + 3, 512 * 512 * 4 - 1])
      assert.equal(data[corner], 0, `${id} must not retain an opaque outer corner`);
    assert.ok(bytes.length < 50_000, `${id} must stay within the 50kB image budget`);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
    total += bytes.length;
  }
  assert.equal(hashes.size, 20, 'Every character must have its own portrait');
  assert.ok(total < 900_000, 'The entire transparent chooser must stay below 900kB');
});
