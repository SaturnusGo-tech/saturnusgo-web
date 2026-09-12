import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { editDiscussion, listDiscussion, postDiscussion } from "../data/discussion-api";
import { mergeDiscussionComments } from "../application/merge-comments";

const comment = { id: "comment-one", workspaceId: "workspace-one", targetId: "project-one", targetType: "project" as const,
  body: "<script>plain text</script>", author: { identityId: "identity-one", displayName: "Мария" }, createdAt: "2026-09-09T12:00:00Z" };
const scope = { workspaceId: "workspace-one", targetType: "project" as const, targetId: "project-one" };
function client(reply: unknown, requests: { url: URL; init?: RequestInit }[]) {
  return createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (url, init) => { requests.push({ url: new URL(String(url)), init });
      return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch });
}

test("discussion reads the scoped server collection and preserves author and plain text", async () => {
  const requests: { url: URL; init?: RequestInit }[] = [];
  const result = await listDiscussion(client({ data: [comment], meta: { limit: 30, hasMore: true, nextCursor: "next" } }, requests), scope, "older");
  assert.equal(requests[0].url.pathname, "/api/v1/projects/project-one/comments");
  assert.equal(requests[0].url.searchParams.get("workspaceId"), "workspace-one");
  assert.equal(requests[0].url.searchParams.get("limit"), "30");
  assert.equal(requests[0].url.searchParams.get("cursor"), "older");
  assert.equal(result.nextCursor, "next");
  assert.equal(result.items[0].body, comment.body);
  assert.deepEqual(result.items[0].author, comment.author);
});

test("portfolio posting sends only text and workspace with a stable retry key", async () => {
  const requests: { url: URL; init?: RequestInit }[] = [];
  const result = await postDiscussion(client({ data: comment }, requests), { ...scope, targetType: "portfolio", targetId: "portfolio-one" }, "  Проверим оплату  ", "stable-comment-key");
  assert.equal(requests[0].url.pathname, "/api/v1/portfolios/portfolio-one/comments");
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { workspaceId: "workspace-one", body: "Проверим оплату" });
  assert.equal(new Headers(requests[0].init?.headers).get("Idempotency-Key"), "stable-comment-key");
  assert.equal(new Headers(requests[0].init?.headers).get("If-Match"), null);
  assert.equal(result.author.displayName, "Мария");
});

test("refresh merges confirmed comments without duplicate or disappearing posts", () => {
  const older = { ...comment, id: "older", createdAt: "2026-09-08T12:00:00Z" };
  const newest = { ...comment, id: "new", createdAt: "2026-09-10T12:00:00Z" };
  const result = mergeDiscussionComments([older, { ...comment, body: "Server value" }], [newest, comment]);
  assert.deepEqual(result.map((item) => item.id), ["new", "comment-one", "older"]);
  assert.equal(result[1].body, "Server value");
});

test("editing keeps scoped URL, author-controlled revision and stable retry key", async () => {
 const requests: { url: URL; init?: RequestInit }[] = [];
 const updated = { ...comment, body: "Changed", revision: 2, updatedAt: "2026-09-12T12:00:00Z", canEdit: true };
 const result = await editDiscussion(client({ data: updated }, requests), scope, { ...comment, revision: 1, canEdit: true }, " Changed ", "stable-comment-edit-key");
 assert.equal(requests[0].url.pathname, "/api/v1/projects/project-one/comments/comment-one");
 assert.equal(requests[0].init?.method, "PATCH");
 assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { workspaceId: "workspace-one", body: "Changed", revision: 1 });
 assert.equal(result.revision, 2); assert.equal(result.canEdit, true);
 assert.equal(mergeDiscussionComments([{ ...comment, revision: 1 }], [result])[0].body, "Changed");
 assert.equal(mergeDiscussionComments([{ ...result, revision: 3, body: "Newer server edit" }], [result])[0].body, "Newer server edit");
});
