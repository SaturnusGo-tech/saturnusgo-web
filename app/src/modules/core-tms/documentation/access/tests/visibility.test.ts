import assert from "node:assert/strict";
import test from "node:test";
import { visibleArticles } from "../visible-articles";
import { docArticles } from "../../content/catalog";
import { searchArticles } from "../../model/search";

test("non-admin catalog excludes account article from navigation, lookup and search", () => {
  const catalog = visibleArticles(docArticles, false);
  assert.equal(catalog.some(article => article.id === "company-access"), false);
  assert.equal(new Map(catalog.map(article => [article.id, article])).has("company-access"), false);
  assert.equal(searchArticles(catalog, "личный профиль").some(result => result.article.id === "company-access"), false);
  assert.ok(catalog.some(article => article.id === "create-test-case"));
});
test("administrator retains the account article", () => {
  assert.deepEqual(visibleArticles(docArticles, true), docArticles);
});
test("AI and marker are separate Russian articles", () => {
  const ai = docArticles.find(article => article.id === "falcon-ai-writing")!;
  assert.ok(ai);
  assert.equal(ai.sections.some(section => section.id.startsWith("english") || section.id === "marker"), false);
  assert.ok(docArticles.some(article => article.id === "colored-marker"));
});
