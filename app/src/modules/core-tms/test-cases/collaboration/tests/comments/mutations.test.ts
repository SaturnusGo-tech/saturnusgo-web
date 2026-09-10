import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../../../../../core/tms/transport/http";
import { changeComment, getComment } from "../../data/comment-mutations";
import { classifyCollaborationFailure } from "../../../../state/case-collaboration/usePagedCaseResource";
const comment = { id: "comment-1", caseId: "case-1", projectId: "project-1", version: 3,
  body: "Review", mentions: ["person-1"], author: { identityId: "person-2", displayName: "Tester" }, createdAt: "2026-09-11T10:00:00Z" };
test("comment mutations transmit scoped optimistic versions and keep notification intent", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const client = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url, init) => { calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: { ...comment, version: 4 } }), { headers: { etag: '"comment-4"' } }); }) as typeof fetch });
  const result = await changeComment(client, "project-1", "case-1", comment, { body: "Edited", mentions: ["person-3"], notifyChannels: ["telegram"] });
  assert.equal(result.version, 4);
  assert.equal(calls[0].init?.method, "PATCH");
  assert.equal(new Headers(calls[0].init?.headers).get("if-match"), '"comment-3"');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { projectId: "project-1", version: 3, body: "Edited", mentions: ["person-3"], notifyChannels: ["telegram"] });
  await changeComment(client, "project-1", "case-1", comment, null);
  assert.equal(calls[1].init?.method, "DELETE");
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { projectId: "project-1", version: 3 });
  await getComment(client, "project-1", "case-1", "comment-1");
  assert.equal(new URL(calls[2].url).searchParams.get("projectId"), "project-1");
  await assert.rejects(changeComment(client, "project-1", "case-1", { ...comment, version: undefined }, null));
  assert.equal(calls.length, 3);
});
test("safe field validation identifies unavailable mentions without exposing server internals", async () => {
  const client = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async () => new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Invalid reference", details: { field: "mentions" }, requestId: "request-1" } }), { status: 400 })) as typeof fetch });
  await assert.rejects(changeComment(client, "project-1", "case-1", comment, { body: "Draft" }), (error: unknown) => {
    assert.ok(error instanceof TmsApiError); assert.equal(error.requestId, "request-1");
    assert.equal(classifyCollaborationFailure(error), "invalid_mentions"); return true;
  });
});
