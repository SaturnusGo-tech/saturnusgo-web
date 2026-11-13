import assert from "node:assert/strict";
import test from "node:test";
import { docArticles, articleById, docGroups } from "../content/catalog";
import { articleById as russianArticles } from "../content-ru/catalog";
import { readingMinutes, searchArticles } from "../model/search";
import { INTEGRATIONS } from "../../presentation/hooks/catalog/integration-definitions";
import { providers } from "../../connectors/model/connector-types";

test("every documented article and section is addressable and all cross-links resolve", () => {
  assert.equal(articleById.size, docArticles.length);
  for (const article of docArticles) {
    assert.match(article.id, /^[a-z][a-z0-9-]{0,63}$/);
    assert.ok(docGroups.some((g) => g.id === article.group), article.id);
    assert.ok(article.title && article.description && article.sections.length > 1, article.id);
    const sections = new Set(article.sections.map((s) => s.id));
    assert.equal(sections.size, article.sections.length, article.id);
    for (const section of article.sections) {
      assert.match(section.id, /^[a-z][a-z0-9-]{0,63}$/);
      assert.ok(section.blocks.length > 0);
      for (const block of section.blocks) {
        if (block.kind === "articles") for (const id of block.ids) assert.ok(articleById.has(id), `${article.id} → ${id}`);
        if (block.kind === "table") for (const row of block.rows) assert.equal(row.length, block.columns.length, article.id);
      }
    }
    for (const id of article.related) assert.ok(articleById.has(id), `${article.id} → ${id}`);
    for (const source of article.sources ?? []) assert.equal(new URL(source.url).protocol, "https:");
    assert.ok(readingMinutes(article) >= 1);
  }
});
test("the built-in article catalog and walkthroughs contain English copy", () => {
  assert.doesNotMatch(JSON.stringify(docGroups), /[\u0400-\u04ff]/u);
  // Walkthroughs preserve these actual saved record names rather than silently translating user data.
  const savedNames: Record<string, readonly string[]> = {
    portfolios: ["Руководство Falcon"], swagger: ["API заказов", "Кабинет хоста"],
  };
  for (const article of docArticles) {
    const copy = (savedNames[article.id] ?? []).reduce((text, name) => text.replaceAll(name, "Saved record name"), JSON.stringify(article));
    assert.doesNotMatch(copy, /[\u0400-\u04ff]/u, article.id);
  }
});
test("all catalog services are documented with accurate implementation availability", () => {
  for (const integration of INTEGRATIONS) {
    const article = articleById.get(integration.id === "codex" ? "codex-web-qa" : integration.id);
    assert.ok(article, integration.id);
    const available = integration.id === "codex" || integration.id === "youtrack" || providers.some((provider) => provider === integration.id);
    assert.equal(article.status === "planned", !available, integration.id);
  }
});
test("search finds English tasks, service names and body terms without case sensitivity", () => {
  assert.equal(searchArticles(docArticles, "delete case")[0]?.article.id, "archive-test-case");
  assert.equal(searchArticles(docArticles, "SLACK channel")[0]?.article.id, "slack");
  assert.equal(searchArticles(docArticles, "TeamCity")[0]?.article.id, "teamcity");
  assert.ok(searchArticles(docArticles, "report").length > 0);
  assert.deepEqual(searchArticles(docArticles, "REPORT").map((r) => r.article.id), searchArticles(docArticles, "report").map((r) => r.article.id));
  assert.ok(searchArticles(docArticles, "signing secret").length > 0);
  assert.deepEqual(searchArticles(docArticles, " \n "), []);
  assert.deepEqual(searchArticles(docArticles, "zzznomatchingarticle"), []);
});

test("exchange guides describe preparation before destination and explicit project-scoped actions", () => {
  for (const [catalog, expected] of [[articleById, ["Wait and review", "Choose the destination", "Confirm the import"]],
    [russianArticles, ["Дождитесь подготовки и проверьте структуру", "Выберите место", "Подтвердите импорт"]]] as const) {
    const article = catalog.get("import-export")!;
    const imports = article.sections.find(section => section.id === "import")!.blocks[0];
    assert.equal(imports.kind, "steps");
    if (imports.kind === "steps") assert.deepEqual(imports.items.slice(2).map(item => item.title), expected);
    const exportText = JSON.stringify(article.sections.find(section => section.id === "export"));
    assert.match(exportText, /Project to export/);
    assert.match(exportText, /Download JSON/);
    assert.match(JSON.stringify(article.sections.find(section => section.id === "file-history")), /File history/);
    assert.ok(article.sections.find(section => section.id === "walkthrough")!.blocks.every(block => block.kind !== "walkthrough"));
  }
});
