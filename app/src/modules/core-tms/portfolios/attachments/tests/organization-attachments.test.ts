import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { listOrganizationAttachments } from "../data/organization-attachments";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
const metadata = { id: "a", projectId: null, owner: { kind: "portfolio", portfolioId: "portfolio" }, kind: "file", originalFilename: "plan.txt", mimeType: "text/plain",
  trustedExtension: "txt", byteSize: 4, sha256: "a".repeat(64), status: "ready", createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z" };
test("organization attachment lists are bounded and owner scoped, never project-wide evidence", async () => {
  const urls: URL[] = [];
  const http = createTmsHttpClient({ apiBase: "https://example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input) => { urls.push(new URL(String(input))); return Response.json({ data: [metadata], meta: { limit: 100, hasMore: true, nextCursor: "next" } }); }) as typeof fetch });
  const signal = new AbortController().signal;
  const page = await listOrganizationAttachments(http, { workspaceId: "w", targetType: "portfolio", targetId: "portfolio" }, null, signal);
  assert.equal(urls[0].searchParams.get("portfolioId"), "portfolio"); assert.equal(urls[0].searchParams.has("projectId"), false);
  assert.equal(page.items[0].projectId, null); assert.deepEqual(page.items[0].owner, metadata.owner); assert.equal(page.nextCursor, "next");
  await listOrganizationAttachments(http, { workspaceId: "w", targetType: "project", targetId: "project" }, "next", signal);
  assert.equal(urls[1].searchParams.get("projectId"), "project"); assert.equal(urls[1].searchParams.get("owner[kind]"), "project");
  assert.equal(urls[1].searchParams.get("owner[projectId]"), "project"); assert.equal(urls[1].searchParams.get("cursor"), "next");
});
test("portfolio upload reuses private PUT/finalize and retries lost finalization without duplicate storage writes", async () => {
  const calls: { url: string; init: RequestInit }[] = []; let finalized = 0;
  const client = createAttachmentClient({ apiBase: "https://example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input, init = {}) => { const url = String(input); calls.push({ url, init });
      if (url.endsWith("upload-intents")) return new Response(JSON.stringify({ data: { intentId: "a", attachmentId: "a", method: "PUT", uploadUrl: "https://storage.test/object",
        headers: {}, expiresAt: "2099-01-01T00:00:00Z", mimeType: "text/plain", maxBytes: 100 } }), { headers: { etag: '"intent-v1"' } });
      if (url === "https://storage.test/object") return new Response(null, { headers: { etag: '"object-v1"' } });
      finalized++; if (finalized === 1) throw new Error("Response lost"); return Response.json({ data: metadata });
    }) as typeof fetch });
  const input = { portfolioId: "portfolio", owner: { kind: "portfolio" as const, portfolioId: "portfolio" }, kind: "file" as const,
    mimeType: "text/plain" as const, file: new File(["plan"], "plan.txt", { type: "text/plain" }), operationKey: "portfolio-file-operation" };
  await assert.rejects(client.upload(input)); assert.equal((await client.upload(input)).projectId, null);
  const body = JSON.parse(String(calls[0].init.body)); assert.equal(body.portfolioId, "portfolio"); assert.equal("projectId" in body, false);
  assert.equal(calls.filter((call) => call.url === "https://storage.test/object").length, 1);
  const put = calls.find((call) => call.url === "https://storage.test/object")!;
  assert.equal(put.init.credentials, "omit"); assert.equal(new Headers(put.init.headers).has("Authorization"), false);
  assert.equal(new Headers(calls[2].init.headers).get("If-Match"), '"intent-v1"');
  assert.equal(new Headers(calls[2].init.headers).get("Idempotency-Key"), new Headers(calls[3].init.headers).get("Idempotency-Key"));
});
test("mismatched organization ownership rejects before any HTTP request", async () => {
  let calls = 0;
  const client = createAttachmentClient({ apiBase: "https://example.test/api/v1", accessToken: async () => "test.token.value", fetch: (async () => { calls++; throw new Error("unused"); }) as typeof fetch });
  await assert.rejects(client.upload({ portfolioId: "one", owner: { kind: "portfolio", portfolioId: "two" }, kind: "file", mimeType: "text/plain",
    file: new File(["plan"], "plan.txt", { type: "text/plain" }), operationKey: "portfolio-file-operation" }), /scope/);
  assert.equal(calls, 0);
});
