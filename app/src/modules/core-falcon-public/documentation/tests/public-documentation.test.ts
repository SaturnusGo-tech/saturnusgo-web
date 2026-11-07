import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";
import { htmlLanguageForPath, isFalconPublicPath } from "../../../../shared/_components/route-flags";
import { documentationCatalog } from "../../../core-tms/documentation/localization/catalog/locale-catalog";
import { buildDocumentationFolders } from "../../../core-tms/documentation/model/library";
import { searchArticles } from "../../../core-tms/documentation/model/search";
import { publicDocumentationCatalog } from "../catalog";

test("both readers expose the complete localized Codex playbook", () => {
  const locales = ["en", "ru"] as const;
  const sectionsByLocale = locales.map(locale => {
    const { articles, groups } = publicDocumentationCatalog(locale);
    const workspace = documentationCatalog(locale, false);
    const publicPlaybook = articles.filter(article => article.group === "codex-prompts");
    const workspacePlaybook = workspace.docArticles.filter(article => article.group === "codex-prompts");
    const library = publicPlaybook.find(article => article.id === "codex-prompts");
    assert.ok(library);
    assert.equal(publicPlaybook.length, 7);
    assert.deepEqual(publicPlaybook.map(article => article.sections), workspacePlaybook.map(article => article.sections));
    const libraryFolder = buildDocumentationFolders(articles, groups, locale).find(folder => folder.id === "codex-prompts");
    assert.deepEqual(libraryFolder?.articleIds, [library.id]);
    assert.equal(libraryFolder.children.flatMap(folder => folder.articleIds).length, publicPlaybook.length - 1);
    assert.equal(searchArticles(articles, locale === "ru" ? "сценарии codex" : "codex playbook", locale)[0]?.article.id, library.id);
    const prompts = publicPlaybook.flatMap(article => article.sections.flatMap(section => section.blocks))
      .filter(block => block.kind === "code" && block.language === "prompt");
    assert.ok(prompts.length >= 24);
    assert.ok(prompts.every(prompt => "text" in prompt && prompt.text.trim().length > 100));
    return publicPlaybook.map(article => [article.id, article.sections.map(section => section.id)]);
  });
  assert.deepEqual(sectionsByLocale[0], sectionsByLocale[1]);
});

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
  assert.match(source, /href=\{appHref \?\? `\/cloud-login\/\?lang=\$\{locale\}`\}/);
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

test("article images follow the reader language using authenticated production captures at their native dimensions", async () => {
  const { publicDocumentationCatalog } = await import("../catalog");
  const { documentationArticleImage } = await import("../../../core-tms/documentation/model/library");
  const used = new Set<string>();
  for (const locale of ["en", "ru"] as const) {
    const allowed = new Set(["repository", "run", "suites", "dashboard", "integrations", "codex"].map(name =>
      `/falcon/landing/2026-11/${locale}/product-${name}.webp`));
    for (const article of publicDocumentationCatalog(locale).articles) {
      const image = documentationArticleImage(article.id, locale);
      if (!image) continue;
      assert.ok(allowed.has(image.src), `${article.id} contains an unreviewed image`);
      assert.ok(image.alt);
      assert.equal(image.width, 3456, `${article.id}: reserve the native capture width`);
      assert.equal(image.height, 2234, `${article.id}: reserve the native capture height`);
      assert.doesNotMatch(image.src, /\/falcon\/docs\/|workspace_|project_/i);
      used.add(image.src);
      const bytes = await readFile(new URL(`../../../../../../public${image.src}`, import.meta.url));
      assert.equal(bytes.subarray(0, 4).toString(), "RIFF");
      assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
      const provenance = JSON.parse(await readFile(new URL(`../../../../../../public${image.src}.json`, import.meta.url), "utf8"));
      assert.equal(provenance.origin, "https://umbrella-falcon.saturnusgo.com");
      assert.ok(Number.isFinite(Date.parse(provenance.capturedAt)));
      assert.match(provenance.releaseSha, /^[a-f0-9]{40}$/);
      assert.equal(provenance.locale, locale);
      assert.equal(provenance.contentLanguage, locale);
      assert.deepEqual(provenance.viewport, { width: 1728, height: 1117, deviceScaleFactor: 2 });
      assert.match(provenance.rawSha256, /^[a-f0-9]{64}$/);
      assert.equal(provenance.finalSha256, createHash("sha256").update(bytes).digest("hex"));
    }
  }
  assert.equal(used.size, 12);
});
