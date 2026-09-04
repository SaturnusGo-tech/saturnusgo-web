import assert from "node:assert/strict";
import test from "node:test";

import type { AttachmentTransportPort } from "../application/attachment-transport-port";
import {
  createPrivateAttachmentClient, type PrivateAttachmentClient,
} from "../application/private-attachment-client";
import { createAttachmentReadCache } from "../application/read-cache/attachment-read-cache";

const digest = "a".repeat(64);

test("upload orchestrates intent, private PUT, and finalize with stable operation keys", async () => {
  const calls: string[] = [];
  const transport: AttachmentTransportPort = {
    async getMetadata() { throw new Error("not used"); },
    async remove() { throw new Error("not used"); },
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
    async getMetadata() { throw new Error("not used"); },
    async remove() { throw new Error("not used"); },
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

test("read cache reuses ready metadata and refreshes expiring signed access", async () => {
  let metadataReads = 0;
  let accessReads = 0;
  let now = Date.parse("2026-09-04T00:00:00.000Z");
  const client = {
    async getMetadata() {
      metadataReads += 1;
      return { metadata: {
        id: "att-1", projectId: "project-1",
        owner: { kind: "run" as const, runId: "run-1" }, kind: "screenshot" as const,
        originalFilename: "proof.png", mimeType: "image/png" as const,
        trustedExtension: "png", byteSize: 12, sha256: null, status: "ready" as const,
        createdAt: "2026-09-04T00:00:00.000Z", updatedAt: "2026-09-04T00:00:00.000Z",
      }, etag: '"attachment:att-1:1"' };
    },
    async createAccess() {
      accessReads += 1;
      return { attachmentId: "att-1", method: "GET" as const,
        url: `https://r2.example.test/read/${accessReads}`, headers: {},
        expiresAt: new Date(now + 60_000).toISOString() };
    },
    async upload() { throw new Error("unused"); },
    async remove() { throw new Error("unused"); },
  } satisfies PrivateAttachmentClient;
  const cache = createAttachmentReadCache(client, () => now);

  await Promise.all([cache.getMetadata("att-1"), cache.getMetadata("att-1")]);
  await cache.getMetadata("att-1");
  assert.equal(metadataReads, 1);
  const first = await cache.createAccess({ attachmentId: "att-1" });
  const second = await cache.createAccess({ attachmentId: "att-1" });
  assert.equal(first.url, second.url);
  assert.equal(accessReads, 1);
  now += 31_000;
  const refreshed = await cache.createAccess({ attachmentId: "att-1" });
  assert.notEqual(refreshed.url, first.url);
  assert.equal(accessReads, 2);
});

test("read cache does not pin pending metadata", async () => {
  let reads = 0;
  const client = {
    async getMetadata() {
      reads += 1;
      return { metadata: {
        id: "att-1", projectId: "project-1",
        owner: { kind: "run" as const, runId: "run-1" }, kind: "file" as const,
        originalFilename: "proof.pdf", mimeType: "application/pdf" as const,
        trustedExtension: "pdf", byteSize: 12, sha256: null,
        status: (reads === 1 ? "pending" : "ready") as "pending" | "ready",
        createdAt: "2026-09-04T00:00:00.000Z", updatedAt: "2026-09-04T00:00:00.000Z",
      }, etag: `"attachment:att-1:${reads}"` };
    },
    async createAccess() { throw new Error("unused"); },
    async upload() { throw new Error("unused"); },
    async remove() { throw new Error("unused"); },
  } satisfies PrivateAttachmentClient;
  const cache = createAttachmentReadCache(client);

  assert.equal((await cache.getMetadata("att-1")).metadata.status, "pending");
  assert.equal((await cache.getMetadata("att-1")).metadata.status, "ready");
  assert.equal(reads, 2);
});
