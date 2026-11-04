import assert from "node:assert/strict";
import test from "node:test";
import { docArticles, docGroups } from "../../content/catalog";
import { publicDocumentationCatalog } from "../../../../core-falcon-public/documentation/catalog";

type Folder = { id: string; title: string; articleIds: string[]; children: Folder[] };
const flatten = (folders: Folder[]): string[] => folders.flatMap(folder => [...folder.articleIds, ...flatten(folder.children)]);

async function library() {
  const module = await import("../library").catch(() => null);
  assert.ok(module, "The shared, content-independent documentation taxonomy must exist");
  return module;
}

test("folders preserve supplied group order and retain unfamiliar articles", async () => {
  const { buildDocumentationFolders } = await library();
  const articles = Object.freeze([
    { id: "new-reference", group: "reference" },
    { id: "execute-run", group: "runs" },
    { id: "new-run-feature", group: "runs" },
    { id: "ignored-group", group: "missing" },
  ]);
  const folders = buildDocumentationFolders(articles, [
    { id: "reference", title: "My reference" },
    { id: "cases", title: "Empty" },
    { id: "runs", title: "My runs" },
  ], "en");
  assert.deepEqual(folders.map(({ id, title }) => ({ id, title })), [
    { id: "reference", title: "My reference" }, { id: "runs", title: "My runs" },
  ]);
  assert.deepEqual(folders[1].articleIds, ["new-run-feature"]);
  assert.deepEqual(flatten(folders), ["new-reference", "new-run-feature", "execute-run"]);
});

test("subfolders organize fields, execution, and integration families in both languages", async () => {
  const { buildDocumentationFolders } = await library();
  for (const locale of ["en", "ru"] as const) {
    const folders = buildDocumentationFolders(docArticles, docGroups, locale);
    const children = folders.flatMap(folder => folder.children);
    assert.deepEqual(children.find(folder => folder.id === "cases:fields")?.articleIds, ["custom-fields", "custom-field-values"]);
    assert.deepEqual(children.find(folder => folder.id === "runs:execution")?.articleIds, ["execute-run", "retest"]);
    assert.deepEqual(children.find(folder => folder.id === "integrations:issue-trackers")?.articleIds, ["youtrack", "jira", "linear", "trello"]);
    assert.equal(children.find(folder => folder.id === "cases:fields")?.title, locale === "ru" ? "Поля и значения" : "Fields and values");
    assert.equal(children.find(folder => folder.id === "runs:execution")?.title, locale === "ru" ? "Выполнение тестов" : "Test execution");
    const ids = flatten(folders);
    assert.equal(ids.length, docArticles.length);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual([...ids].sort(), docArticles.map(article => article.id).sort());
  }
});

test("public folders contain exactly the supplied allowlist with no private or empty branches", async () => {
  const { buildDocumentationFolders } = await library();
  for (const locale of ["en", "ru"] as const) {
    const catalog = publicDocumentationCatalog(locale);
    const folders = buildDocumentationFolders(catalog.articles, catalog.groups, locale);
    const ids = flatten(folders);
    assert.deepEqual([...ids].sort(), catalog.articles.map(article => article.id).sort());
    for (const hidden of ["company-access", "company-administration", "falcon-ai-writing", "falcon-ai-chat", "gitlab", "teamcity", "jenkins"]) assert.ok(!ids.includes(hidden));
    const inspect = (items: Folder[]) => items.forEach(folder => {
      assert.ok(folder.articleIds.length || folder.children.length, `Empty branch: ${folder.id}`);
      inspect(folder.children);
    });
    inspect(folders);
    assert.deepEqual(buildDocumentationFolders([], catalog.groups, locale), []);
  }
});

test("a repeated input ID is rendered once and group IDs remain unique", async () => {
  const { buildDocumentationFolders } = await library();
  const folders = buildDocumentationFolders([
    { id: "create-run", group: "runs" }, { id: "create-run", group: "runs" },
  ], [{ id: "runs", title: "Runs" }, { id: "runs", title: "Repeated group" }], "en");
  assert.deepEqual(flatten(folders), ["create-run"]);
  assert.equal(folders.length, 1);
});

test("new group identifiers do not inherit unrelated taxonomy definitions", async () => {
  const { buildDocumentationFolders } = await library();
  assert.deepEqual(buildDocumentationFolders([{ id: "new-article", group: "constructor" }], [
    { id: "constructor", title: "New topic" },
  ], "en"), [{ id: "constructor", title: "New topic", articleIds: ["new-article"], children: [] }]);
});

test("article illustrations use the matching synthetic product capture and localized descriptions", async () => {
  const module = await library();
  assert.equal(typeof module.documentationArticleImage, "function", "The safe article image selector must exist");
  const examples = [
    ["quick-start", "repository"], ["create-test-case", "repository"], ["edit-test-case", "repository"],
    ["organize-cases", "repository"], ["import-export", "repository"],
    ["create-run", "run"], ["execute-run", "run"], ["retest", "run"],
    ["test-suites", "suites"], ["dashboard", "dashboard"],
    ["integration-overview", "integrations"], ["codex-web-qa", "codex"],
  ];
  for (const [articleId, asset] of examples) {
    const english = module.documentationArticleImage(articleId, "en");
    const russian = module.documentationArticleImage(articleId, "ru");
    assert.equal(english?.src, `/falcon/landing/2026-11/product-${asset}.webp`);
    assert.equal(russian?.src, english?.src);
    assert.ok(english?.alt && russian?.alt);
    assert.notEqual(english.alt, russian.alt);
  }
  for (const articleId of ["company-access", "company-administration", "future-article", "constructor", "__proto__"]) {
    assert.equal(module.documentationArticleImage(articleId), undefined);
  }
});
