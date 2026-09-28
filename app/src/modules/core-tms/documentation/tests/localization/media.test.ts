import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { documentationCatalog } from "../../localization/catalog/locale-catalog";
import screenshots from "../../content-ru/walkthroughs/media/screenshots.json";

test("Russian guide uses its own complete screenshot inventory with valid dimensions", () => {
  const used = new Map(documentationCatalog("ru", true).docArticles.flatMap(a => a.sections.flatMap(s =>
    s.blocks.flatMap(b => b.kind === "walkthrough" ? b.steps.map(step => [step.image.src, step.image] as const) : []))));
  for (const [src, image] of used) {
    assert.ok(src.startsWith("/falcon/docs/2026-09-ru/"), src);
    assert.ok(image.alt.length > 20, src);
    const bytes = readFileSync(resolve("public", src.slice(1)));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, src);
    let offset = 2, dimensions;
    while (offset + 9 < bytes.length) {
      const marker = bytes[offset + 1];
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        dimensions = {width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5)}; break;
      }
      offset += bytes.readUInt16BE(offset + 2) + 2;
    }
    assert.deepEqual(dimensions, { width: image.width, height: image.height }, src);
  }
  const assets = readdirSync("public/falcon/docs/2026-09-ru").filter(f => f.endsWith(".jpg")).sort();
  assert.deepEqual(assets, [...used.keys()].map(src => src.split("/").pop()).sort());
  assert.deepEqual(assets, Object.keys(screenshots).map(key => `${key}.jpg`).sort());
});
