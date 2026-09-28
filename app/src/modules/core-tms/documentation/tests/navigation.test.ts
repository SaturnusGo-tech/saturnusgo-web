import assert from "node:assert/strict";
import test from "node:test";
import { defaultArticleId, documentationChatId, documentationLink, safeArticleId } from "../navigation/documentation-link";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";

test("help links keep project scope and remove unrelated entity selections", () => {
  const source = "https://tms.example/work/?workspaceId=w&projectId=p&view=runs&runId=r&runItemId=i&defectId=d&integration=slack&unknown=value#old";
  const href = new URL(documentationLink(source, "github", "rules"), source);
  assert.deepEqual(Object.fromEntries(href.searchParams), { workspaceId: "w", projectId: "p", view: "help", article: "github" });
  assert.equal(href.hash, "#rules");
  assert.deepEqual(readWorkspaceDeepLink(href.toString()), { view: "help", runId: null });
});
test("workspace restoration keeps an article and section after reload and project changes", () => {
  const source = "https://tms.example/work/?workspaceId=w&projectId=p&view=help&article=trello#webhook";
  const restored = buildWorkspaceDeepLink(source, { workspaceId: "w", projectId: "p2", view: "help", runId: "stale" });
  const url = new URL(restored);
  assert.equal(url.searchParams.get("article"), "trello");
  assert.equal(url.hash, "#webhook");
  assert.equal(url.searchParams.get("runId"), null);
  const leaving = new URL(buildWorkspaceDeepLink(restored, { workspaceId: "w", projectId: "p2", view: "runs", runId: "new-run" }));
  assert.equal(leaving.searchParams.get("article"), null);
  assert.equal(leaving.hash, "");
  assert.equal(leaving.searchParams.get("runId"), "new-run");
});
test("invalid article input cannot inject a URL and valid unknown slugs remain distinguishable", () => {
  for (const value of [null, "", "../other", "https://other.example", "<script>", "x".repeat(65)]) assert.equal(safeArticleId(value), documentationChatId);
  assert.equal(safeArticleId("future-article"), "future-article");
  const url = new URL(documentationLink("https://tms.example/work/", "https://other.example"), "https://tms.example");
  assert.equal(url.origin, "https://tms.example");
  assert.equal(url.searchParams.get("article"), documentationChatId);
});

test("Help opens Falcon AI by default while explicit guide articles remain addressable", () => {
  assert.equal(defaultArticleId, documentationChatId);
  assert.equal(safeArticleId(null), documentationChatId);
  assert.equal(safeArticleId("introduction"), "introduction");
  const source = "https://tms.example/work/?workspaceId=w&projectId=p&view=help";
  const chat = new URL(documentationLink(source, documentationChatId), source);
  const article = new URL(documentationLink(chat.href, "create-run", "builds"), source);
  assert.equal(chat.searchParams.get("article"), documentationChatId);
  assert.equal(article.searchParams.get("article"), "create-run");
  assert.equal(article.hash, "#builds");
  assert.equal(article.searchParams.get("workspaceId"), "w");
  assert.equal(article.searchParams.get("projectId"), "p");
});
