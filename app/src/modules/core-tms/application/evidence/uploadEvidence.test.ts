import assert from "node:assert/strict";
import test from "node:test";
import type { PrivateAttachmentClient } from "../../attachments/application/private-attachment-client";
import type { UploadPrivateAttachmentInput } from "../../attachments/domain/attachment";
import { uploadEvidence } from "./uploadEvidence";

test("uploads evidence through private intents with stable retry keys", async () => {
  const uploads: UploadPrivateAttachmentInput[] = [];
  const client: PrivateAttachmentClient = {
    async getMetadata() { throw new Error("unused"); },
    async remove() { throw new Error("unused"); },
    async upload(input) {
      uploads.push(input);
      return {
        id: `attachment-${uploads.length}`,
        projectId: input.projectId,
        owner: input.owner,
        kind: input.kind,
        originalFilename: input.file.name,
        mimeType: input.mimeType,
        trustedExtension: input.file.name.endsWith(".png") ? "png" : "log",
        byteSize: input.file.size,
        sha256: "a".repeat(64),
        status: "ready",
        createdAt: "2026-08-28T00:00:00Z",
        updatedAt: "2026-08-28T00:00:00Z",
      };
    },
    async createAccess() { throw new Error("unused"); },
  };
  const files = [
    new File(["image"], "screen.png", { type: "image/png" }),
    new File(["log"], "run.log", { type: "" }),
  ];
  const result = await uploadEvidence({
    client,
    projectId: "project-1",
    owner: { kind: "run_attempt", runId: "run-1", runItemId: "item-1", attemptNo: 2 },
    files,
    operationKeyPrefix: "operation-123456789",
  });
  assert.deepEqual(uploads.map((item) => item.operationKey), [
    "operation-123456789:0",
    "operation-123456789:1",
  ]);
  assert.deepEqual(uploads.map((item) => item.kind), ["screenshot", "log"]);
  assert.deepEqual(result.map((item) => item.status), ["ready", "ready"]);
});
