import assert from "node:assert/strict";
import test from "node:test";
import { createPrivateAttachmentClient } from "../../application/private-attachment-client";
import type { AttachmentTransportPort, FinalizeUploadInput } from "../../application/attachment-transport-port";
import type { AttachmentMetadata } from "../../domain/attachment";

test("a lost finalization response retries that request without a second upload intent or PUT", async () => {
  let intents = 0; let puts = 0;
  const finalizations: FinalizeUploadInput[] = [];
  const transport: AttachmentTransportPort = {
    async getMetadata() { throw new Error("unused"); },
    async createAccess() { throw new Error("unused"); },
    async remove() { throw new Error("unused"); },
    async createUploadIntent() { intents++; return { etag: '"attachment:a:1"',
    intent: { intentId: "a", attachmentId: "a", method: "PUT", uploadUrl: "https://upload.test/a",
      headers: {}, expiresAt: "2099-01-01T00:00:00Z", mimeType: "text/plain", maxBytes: 100 } }; },
    async uploadPrivateObject() { puts++; return "uploaded"; },
    async finalizeUpload(input: FinalizeUploadInput) { finalizations.push(input);
      if (finalizations.length === 1) throw new Error("Response lost after server commit");
      return { id: "a", status: "ready" } as AttachmentMetadata;
    },
  };
  const client = createPrivateAttachmentClient({ transport, digest: async () => "a".repeat(64) });
  const input = { projectId: "p", owner: { kind: "shared_step_revision", sharedStepId: "s", revisionNo: 1, stepId: "i" } as const,
    kind: "file" as const, mimeType: "text/plain" as const, file: new File(["test"], "test.txt", { type: "text/plain" }), operationKey: "upload-shared-retry" };
  await assert.rejects(client.upload(input));
  assert.equal((await client.upload(input)).status, "ready");
  assert.equal(intents, 1); assert.equal(puts, 1); assert.equal(finalizations.length, 2);
  assert.deepEqual(finalizations[0], finalizations[1]);
});
