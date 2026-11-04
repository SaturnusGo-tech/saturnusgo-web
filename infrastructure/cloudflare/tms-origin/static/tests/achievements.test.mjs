import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";
import { requiredPublicAssets, publicAssetPrefixes } from "../../route-manifest.mjs";

test("all 40 approved achievement images are covered by the public release readiness check", () => {
  const files = readdirSync(new URL("../../../../../public/falcon/achievements/", import.meta.url)).filter(file => file.endsWith(".webp"));
  assert.equal(files.length, 40);
  for (const file of files) {
    const path = `/falcon/achievements/${file}`;
    assert.ok(requiredPublicAssets.includes(path), `${file} must be verified before publication`);
    assert.ok(publicAssetPrefixes.some(prefix => path.startsWith(prefix)));
  }
});
