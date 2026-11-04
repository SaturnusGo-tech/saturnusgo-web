import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { htmlLanguageForPath, isFalconPublicPath } from "../../../../shared/_components/route-flags";

test("the public guide exposes only curated text in both languages", async () => {
  const module = await import("../catalog").catch(() => null);
  assert.ok(module, "The isolated public documentation catalog must exist");
  for (const locale of ["en", "ru"] as const) {
    const catalog = module.publicDocumentationCatalog(locale);
    assert.ok(catalog.articles.length > 20);
    const ids = new Set(catalog.articles.map(article => article.id));
    assert.ok(ids.has("create-test-case"));
    assert.ok(ids.has("organize-cases"));
    for (const hidden of ["company-access", "company-administration", "falcon-ai-writing", "falcon-ai-chat"]) assert.ok(!ids.has(hidden));
    const serialized = JSON.stringify(catalog);
    assert.doesNotMatch(serialized, /"kind":"walkthrough"|\/falcon\/docs\/20|workspace_umbrella|project_[a-z0-9]|umbrella-home\.youtrack|Umbrella-Host|Umbrella Home/i);
    for (const article of catalog.articles) {
      assert.ok(!article.adminOnly);
      for (const id of article.related) assert.ok(ids.has(id));
      for (const section of article.sections) for (const block of section.blocks) {
        if (block.kind === "articles") for (const id of block.ids) assert.ok(ids.has(id));
      }
    }
  }
});

test("the public reader cannot mount workspace, authentication or AI clients", async () => {
  const source = await readFile(new URL("../PublicDocumentation.tsx", import.meta.url), "utf8").catch(() => "");
  assert.ok(source, "The isolated public reader must exist");
  assert.doesNotMatch(source, /useDocumentation|TmsWorkspace|WorkspacePeople|TmsSession|HttpClient|fetch\s*\(|axios|FalconAI|DocumentationChat/);
  assert.match(source, /href=\{`\/cloud-login\/\?lang=\$\{locale\}`\}/);
  for (const file of ["PublicDocumentation.tsx", "ArticleContent.tsx", "copy.ts"]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from\s+["'][^"']*(?:content(?:-ru)?\/catalog|\.\/catalog|\/auth\/|\/chat\/)/);
  }
});

test("public documentation has its own route language, independent of account preferences", () => {
  for (const path of ["/docs", "/docs/", "/ru/docs/", "/ru/docs"]) assert.ok(isFalconPublicPath(path));
  assert.equal(htmlLanguageForPath("/docs/", "ru", "ru"), "en");
  assert.equal(htmlLanguageForPath("/ru/docs/", "en", "en"), "ru");
  assert.equal(isFalconPublicPath("/docs-private/"), false);
  assert.equal(isFalconPublicPath("/testcases/umbrella-home/work/"), false);
});
