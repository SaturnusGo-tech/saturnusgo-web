import assert from "node:assert/strict";
import test from "node:test";

import { createAttachmentClient } from "../create-attachment-client";

const checksum = "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=";
const sha256 = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

test("authenticated API calls never leak bearer credentials to the private object PUT", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher = (async (resource: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(resource);
    calls.push({ url, init });
    if (url.endsWith("/attachments/upload-intents")) {
      const body = JSON.parse(String(init.body)) as { sha256: string };
      assert.equal(body.sha256, sha256);
      return json({
        intentId: "att-1", attachmentId: "att-1", status: "pending", method: "PUT",
        uploadUrl: "https://r2.example.test/private-object",
        headers: { "Content-Type": "text/plain", "x-amz-checksum-sha256": checksum },
        expiresAt: "2030-01-01T00:00:00.000Z", mimeType: "text/plain",
        trustedExtension: "txt", maxBytes: 104857600,
      }, 201, { etag: '"attachment:att-1:1"' });
    }
    if (url === "https://r2.example.test/private-object") {
      return new Response(null, { status: 200, headers: { etag: '"storage-etag"' } });
    }
    if (url.endsWith("/attachments/upload-intents/att-1/finalize")) {
      return json({
        id: "att-1", projectId: "project-1", owner: { kind: "run", runId: "run-1" },
        kind: "log", originalFilename: "hello.txt", mimeType: "text/plain",
        trustedExtension: "txt", byteSize: 5, sha256, status: "ready", createdBy: "identity-1",
        storedAt: "2026-08-28T00:00:00.000Z", failureCode: null, deletingAt: null, deletedAt: null,
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
      });
    }
    if (url.endsWith("/attachments/att-1") && init.method === "GET") {
      return json({
        id: "att-1", projectId: "project-1", owner: { kind: "run", runId: "run-1" },
        kind: "log", originalFilename: "hello.txt", mimeType: "text/plain",
        trustedExtension: "txt", byteSize: 5, sha256, status: "ready", createdBy: "identity-1",
        storedAt: "2026-08-28T00:00:00.000Z", failureCode: null, deletingAt: null, deletedAt: null,
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
      }, 200, { etag: '"attachment:att-1:2"' });
    }
    if (url.endsWith("/attachments/att-1") && init.method === "DELETE") {
      return json({
        id: "att-1", projectId: "project-1", owner: { kind: "run", runId: "run-1" },
        kind: "log", originalFilename: "hello.txt", mimeType: "text/plain",
        trustedExtension: "txt", byteSize: 5, sha256, status: "deleting", createdBy: "identity-1",
        storedAt: "2026-08-28T00:00:00.000Z", failureCode: null,
        deletingAt: "2026-08-28T00:00:01.000Z", deletedAt: null,
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:01.000Z",
      }, 200, { etag: '"attachment:att-1:3"' });
    }
    if (url.endsWith("/attachments/att-1/access")) {
      return json({
        attachmentId: "att-1", trustedExtension: "txt", method: "GET",
        url: "https://r2.example.test/private-read", headers: {}, expiresAt: "2030-01-01T00:00:00.000Z",
      });
    }
    throw new Error(`Unexpected URL ${url}`);
  }) as typeof fetch;
  let tokenRequests = 0;
  const client = createAttachmentClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => { tokenRequests += 1; return "header.payload.signature"; },
    fetch: fetcher,
  });

  const uploaded = await client.upload({
    projectId: "project-1", owner: { kind: "run", runId: "run-1" }, kind: "log",
    mimeType: "text/plain", file: new File(["hello"], "hello.txt", { type: "text/plain" }),
    operationKey: "stable-operation-key",
  });
  const metadata = await client.getMetadata(uploaded.id);
  const removed = await client.remove({
    attachmentId: uploaded.id, etag: metadata.etag, operationKey: "remove-operation-key",
  });
  const access = await client.createAccess({ attachmentId: uploaded.id, disposition: "inline" });

  assert.equal(access.method, "GET");
  assert.equal(metadata.metadata.originalFilename, "hello.txt");
  assert.equal(removed.metadata.status, "deleting");
  assert.equal(tokenRequests, 5);
  const [intent, put, finalize, metadataRead, remove, read] = calls;
  assert.equal(new Headers(intent.init.headers).get("authorization"), "Bearer header.payload.signature");
  assert.equal(new Headers(put.init.headers).get("authorization"), null);
  assert.equal(new Headers(put.init.headers).get("x-amz-checksum-sha256"), checksum);
  assert.equal(put.init.credentials, "omit");
  assert.equal(new Headers(finalize.init.headers).get("if-match"), '"attachment:att-1:1"');
  assert.equal(new Headers(metadataRead.init.headers).get("authorization"), "Bearer header.payload.signature");
  assert.equal(new Headers(remove.init.headers).get("authorization"), "Bearer header.payload.signature");
  assert.equal(new Headers(remove.init.headers).get("if-match"), '"attachment:att-1:2"');
  assert.equal(new Headers(remove.init.headers).get("idempotency-key"), "remove-operation-key");
  assert.equal(new Headers(read.init.headers).get("authorization"), "Bearer header.payload.signature");
});

test("an aborted access-token request preserves cancellation", async () => {
  const aborted = new DOMException("Navigation cancelled", "AbortError");
  const client = createAttachmentClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => { throw aborted; },
    fetch: async () => { throw new Error("fetch must not run"); },
  });

  await assert.rejects(
    () => client.createAccess({ attachmentId: "att-1" }),
    (error: unknown) => error === aborted,
  );
});
