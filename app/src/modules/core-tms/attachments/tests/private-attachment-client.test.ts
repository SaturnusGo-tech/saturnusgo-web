import assert from "node:assert/strict";
import test from "node:test";

import type { AttachmentTransportPort } from "../application/attachment-transport-port";
import { createPrivateAttachmentClient } from "../application/private-attachment-client";

const digest = "a".repeat(64);

test("upload orchestrates intent, private PUT, and finalize with stable operation keys", async () => {
  const calls: string[] = [];
  const transport: AttachmentTransportPort = {
    async createUploadIntent(input) {
      calls.push(`intent:${input.idempotencyKey}:${input.sha256}`);
      return {
        intent: {
          intentId: "att-1", attachmentId: "att-1", method: "PUT",
          uploadUrl: "https://r2.example.test/object", headers: {},
          expiresAt: "2030-01-01T00:00:00.000Z", mimeType: "text/plain", maxBytes: 100,
        },
        etag: '"attachment:att-1:1"',
      };
    },
    async uploadPrivateObject(intent) {
      calls.push(`put:${intent.attachmentId}`);
      return '"storage-etag"';
    },
    async finalizeUpload(input) {
      calls.push(`finalize:${input.idempotencyKey}:${input.intentETag}:${input.storageETag}`);
      return {
        id: "att-1", projectId: "project-1", owner: { kind: "run", runId: "run-1" },
        kind: "log", originalFilename: "evidence.txt", mimeType: "text/plain",
        trustedExtension: "txt", byteSize: 8, sha256: digest, status: "ready",
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:01.000Z",
      };
    },
    async createAccess() {
      throw new Error("not used");
    },
  };
  const client = createPrivateAttachmentClient({
    transport,
    digest: async () => digest,
    now: () => Date.parse("2026-08-28T00:00:00.000Z"),
  });

  const result = await client.upload({
    projectId: "project-1", owner: { kind: "run", runId: "run-1" }, kind: "log",
    mimeType: "text/plain", file: new File(["evidence"], "evidence.txt", { type: "text/plain" }),
    operationKey: "stable-operation-key",
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(calls, [
    `intent:intent:stable-operation-key:${digest}`,
    "put:att-1",
    'finalize:finalize:stable-operation-key:"attachment:att-1:1":"storage-etag"',
  ]);
});

test("an expired upload intent stops before the private PUT", async () => {
  let putCalled = false;
  const transport = {
    async createUploadIntent() {
      return { intent: {
        intentId: "att-1", attachmentId: "att-1", method: "PUT" as const,
        uploadUrl: "https://r2.example.test/object", headers: {},
        expiresAt: "2026-08-27T00:00:00.000Z", mimeType: "text/plain" as const, maxBytes: 100,
      }, etag: '"attachment:att-1:1"' };
    },
    async uploadPrivateObject() { putCalled = true; return '"etag"'; },
    async finalizeUpload() { throw new Error("not used"); },
    async createAccess() { throw new Error("not used"); },
  } satisfies AttachmentTransportPort;
  const client = createPrivateAttachmentClient({
    transport, digest: async () => digest,
    now: () => Date.parse("2026-08-28T00:00:00.000Z"),
  });

  await assert.rejects(() => client.upload({
    projectId: "project-1", owner: { kind: "run", runId: "run-1" }, kind: "log",
    mimeType: "text/plain", file: new File(["x"], "x.txt", { type: "text/plain" }),
    operationKey: "stable-operation-key",
  }), (error: unknown) => {
    assert.equal((error as { code?: string }).code, "UPLOAD_INTENT_EXPIRED");
    return true;
  });
  assert.equal(putCalled, false);
});
