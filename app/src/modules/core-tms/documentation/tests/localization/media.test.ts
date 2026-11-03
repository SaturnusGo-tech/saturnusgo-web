import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { documentationCatalog } from "../../localization/catalog/locale-catalog";
import screenshots from "../../content-ru/walkthroughs/media/screenshots.json";
import production from "../../content-ru/walkthroughs/media/screenshots.production.json";
import { historicalGuideMedia } from "../../model/visual/compatibility/historical-media";

test("Russian guide uses its own complete screenshot inventory with valid dimensions", () => {
  const used = new Map(documentationCatalog("ru", true).docArticles.flatMap(a => a.sections.flatMap(s =>
    s.blocks.flatMap(b => b.kind === "walkthrough" ? b.steps.map(step => [step.image.src, step.image] as const) : []))));
  for (const [src, image] of used) {
    assert.match(src, /^\/falcon\/docs\/(?:2026-09-ru\/[a-z0-9-]+|2026-11-ru\/[a-z0-9-]+)\.jpg$/);
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
  const legacy = Object.keys(screenshots).map(key => `${key}.jpg`).sort();
  const newAssets = readdirSync("public/falcon/docs/2026-11-ru").filter(f => f.endsWith(".jpg")).sort();
  const previous = JSON.parse(readFileSync("public/falcon/docs/2026-11/codex-provenance.json", "utf8")).files
    .filter((image: { file: string }) => image.file.startsWith("/falcon/docs/2026-11-ru/"))
    .map((image: { file: string }) => image.file.split("/").pop());
  const captured = Object.values(production).map(image => (image as { src: string }).src);
  const expected = [...previous, ...captured.map(src => src.split("/").pop())].sort();
  assert.deepEqual(newAssets, expected, "only recorded legacy and registered production images may be published");
  for (const src of used.keys()) if (src.startsWith("/falcon/docs/2026-11-ru/")) assert.ok(expected.includes(src.split("/").pop()), src);
  const retained = historicalGuideMedia.filter(item => item.locale === "ru").map(item => item.src.split("/").pop()!);
  assert.deepEqual(assets, [...legacy, ...retained].sort(), "retain legacy illustrations and explicit historical aliases for saved guide answers");
});
