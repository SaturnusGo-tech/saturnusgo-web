import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { docArticles, articleById } from "../../content/catalog";
import { searchArticles } from "../../model/search";
import screenshots from "../../content/walkthroughs/media/screenshots.json";
import production from "../../content/walkthroughs/media/screenshots.production.json";
import { isProductDocsPreviewImage } from "../../content/product-docs/guide-captures";
import { historicalGuideMedia } from "../../model/visual/compatibility/historical-media";

const flows = docArticles.flatMap((article) => article.sections.flatMap((section) =>
  section.blocks.flatMap((block) => block.kind === "walkthrough" ? [{ article, block }] : [])));

function jpegDimensions(bytes: Buffer) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, "asset must be JPEG");
  let offset = 2;
  while (offset + 9 < bytes.length) {
    assert.equal(bytes[offset], 0xff);
    const marker = bytes[offset + 1];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    const length = bytes.readUInt16BE(offset + 2);
    assert.ok(length >= 2);
    offset += length + 2;
  }
  assert.fail("JPEG dimensions missing");
}

test("practical guide articles retain meaningful, captioned screenshot states", () => {
  // The English edition retains full company-access and company-administration text instructions;
  // administrator screenshots are pending authenticated English capture.
  for (const id of ["falcon-ai-writing", "colored-marker", "test-suites", "create-test-case", "edit-test-case", "archive-test-case", "shared-steps", "create-run", "execute-run", "product-docs-authoring",
    "workspace", "portfolios", "organize-cases", "import-export", "dashboard", "create-defect", "jira", "linear", "trello", "github", "slack", "confluence", "swagger"]) {
    assert.ok(flows.some(({ article }) => article.id === id), id);
  }
  for (const { article, block } of flows) {
    assert.ok(block.title && block.steps.length >= 1, article.id);
    assert.equal(new Set(block.steps.map((step) => step.image.src)).size, block.steps.length, article.id);
    for (const step of block.steps) {
      assert.ok(step.title && step.instruction.length > 40 && step.result.length > 40, article.id);
      assert.ok(step.image.alt.length > 30, article.id);
      if (article.id === "product-docs-authoring") assert.ok(isProductDocsPreviewImage(step.image.src, "en"));
      else assert.match(step.image.src, /^\/falcon\/docs\/(?:2026-09\/[a-z0-9-]+-en-20260928|2026-11\/[a-z0-9-]+)\.jpg$/);
    }
  }
});

test("every published screenshot has accurate dimensions and fits the asset budget", () => {
  const used = new Map(flows.flatMap(({ block }) => block.steps.map(({ image }) => [image.src, image] as const)));
  const registered = new Set(Object.values(production).map(image => (image as { src: string }).src));
  const supplied = new Set(JSON.parse(readFileSync("public/falcon/docs/2026-11/codex-provenance.json", "utf8")).files
    .filter((image: { source?: string }) => image.source === "user-supplied-codex-desktop").map((image: { file: string }) => image.file));
  let legacyTotal = 0, productionTotal = 0;
  for (const [src, image] of used) {
    const bytes = readFileSync(resolve("public", src.slice(1)));
    assert.deepEqual(jpegDimensions(bytes), { width: image.width, height: image.height }, src);
    const captured = registered.has(src) || supplied.has(src) || isProductDocsPreviewImage(src, "en");
    assert.ok(bytes.length < (captured ? 1_400_000 : 350_000), `${src}: compress without changing the capture viewport`);
    if (captured) productionTotal += bytes.length; else legacyTotal += bytes.length;
  }
  assert.ok(legacyTotal < 8_000_000, "legacy guide screenshot budget");
  assert.ok(productionTotal < 32_000_000, "DPR2 production guide screenshot budget");
  const assets = readdirSync("public/falcon/docs/2026-09").filter((file) => file.endsWith(".jpg")).sort();
  const legacy = Object.keys(screenshots).map(key => `${key}.jpg`).sort();
  const newAssets = readdirSync("public/falcon/docs/2026-11").filter(file => file.endsWith(".jpg")).sort();
  const previous = JSON.parse(readFileSync("public/falcon/docs/2026-11/codex-provenance.json", "utf8")).files
    .filter((image: { file: string }) => image.file.startsWith("/falcon/docs/2026-11/"))
    .map((image: { file: string }) => image.file.split("/").pop());
  const captured = JSON.parse(readFileSync("public/falcon/docs/2026-11/production-provenance.json", "utf8")).captures
    .map((image: { file: string }) => image.file);
  for (const src of registered) assert.ok(captured.includes(src), src);
  const expected = [...previous, ...captured.map((src: string) => src.split("/").pop())].sort();
  assert.deepEqual(newAssets, expected, "retain recorded production replacements and reject unrecorded images");
  for (const src of used.keys()) if (src.startsWith("/falcon/docs/2026-11/")) assert.ok(expected.includes(src.split("/").pop()), src);
  const retained = historicalGuideMedia.filter(item => item.locale === "en").map(item => item.src.split("/").pop()!);
  assert.deepEqual(assets, [...legacy, ...retained].sort(), "retain legacy illustrations and explicit historical aliases for saved guide answers");
});

test("instructions, outcomes and image descriptions participate in documentation search", () => {
  const article = articleById.get("create-test-case")!;
  assert.ok(searchArticles([article], "verifiable expected results").length);
  assert.ok(searchArticles([article], "does not modify that saved case").length);
  assert.ok(searchArticles([article], "folder tree").length);
  assert.ok(searchArticles(docArticles, "paused Smoke").some((result) => result.article.id === "create-run"));
});
