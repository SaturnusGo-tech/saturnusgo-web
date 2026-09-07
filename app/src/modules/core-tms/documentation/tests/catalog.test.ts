import assert from "node:assert/strict";
import test from "node:test";
import { docArticles, articleById, docGroups } from "../content/catalog";
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
test("all catalog services are documented with accurate implementation availability", () => {
  for (const integration of INTEGRATIONS) {
    const article = articleById.get(integration.id);
    assert.ok(article, integration.id);
    const available = integration.id === "youtrack" || providers.some((provider) => provider === integration.id);
    assert.equal(article.status === "planned", !available, integration.id);
  }
});
test("search finds Russian tasks, service names and body terms without case or ё sensitivity", () => {
  assert.equal(searchArticles(docArticles, "удалить кейс")[0]?.article.id, "archive-test-case");
  assert.equal(searchArticles(docArticles, "SLACK канал")[0]?.article.id, "slack");
  assert.equal(searchArticles(docArticles, "TeamCity")[0]?.article.id, "teamcity");
  assert.deepEqual(searchArticles(docArticles, "отчёт").map((r) => r.article.id), searchArticles(docArticles, "отчет").map((r) => r.article.id));
  assert.ok(searchArticles(docArticles, "signing secret").length > 0);
  assert.deepEqual(searchArticles(docArticles, " \n "), []);
  assert.deepEqual(searchArticles(docArticles, "zzznomatchingarticle"), []);
});
