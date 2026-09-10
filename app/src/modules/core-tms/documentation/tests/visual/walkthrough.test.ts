import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { docArticles, articleById } from "../../content/catalog";
import { searchArticles } from "../../model/search";
import screenshots from "../../content/walkthroughs/media/screenshots.json";

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

test("practical guide articles contain complete, captioned screenshot sequences", () => {
  for (const id of ["create-test-case", "edit-test-case", "archive-test-case", "shared-steps", "create-run", "execute-run",
    "workspace", "portfolios", "organize-cases", "import-export", "dashboard", "create-defect", "jira", "linear", "trello", "github", "slack", "confluence", "swagger", "company-access", "company-administration"]) {
    assert.ok(flows.some(({ article }) => article.id === id), id);
  }
  for (const { article, block } of flows) {
    assert.ok(block.title && block.steps.length >= 3, article.id);
    assert.equal(new Set(block.steps.map((step) => step.image.src)).size, block.steps.length, article.id);
    for (const step of block.steps) {
      assert.ok(step.title && step.instruction.length > 40 && step.result.length > 40, article.id);
      assert.ok(step.image.alt.length > 30, article.id);
      assert.match(step.image.src, /^\/falcon\/docs\/2026-09\/[a-z0-9-]+\.jpg$/);
    }
  }
});

test("every published screenshot has accurate dimensions and fits the asset budget", () => {
  const used = new Map(flows.flatMap(({ block }) => block.steps.map(({ image }) => [image.src, image] as const)));
  let total = 0;
  for (const [src, image] of used) {
    const bytes = readFileSync(resolve("public", src.slice(1)));
    assert.deepEqual(jpegDimensions(bytes), { width: image.width, height: image.height }, src);
    assert.ok(bytes.length < 350_000, `${src}: compress/capture a focused viewport`);
    total += bytes.length;
  }
  assert.ok(total < 8_000_000, "guide screenshot budget");
  const assets = readdirSync("public/falcon/docs/2026-09").filter((file) => file.endsWith(".jpg")).sort();
  assert.deepEqual(assets, [...used.keys()].map((src) => src.split("/").pop()).sort());
  assert.deepEqual(assets, Object.keys(screenshots).map((key) => `${key}.jpg`).sort());
});

test("instructions, outcomes and image descriptions participate in documentation search", () => {
  const article = articleById.get("create-test-case")!;
  assert.ok(searchArticles([article], "начальное состояние").length);
  assert.ok(searchArticles([article], "GUIDE-TC-1").length);
  assert.ok(searchArticles(docArticles, "учебный прогон").some((result) => result.article.id === "create-run"));
});
