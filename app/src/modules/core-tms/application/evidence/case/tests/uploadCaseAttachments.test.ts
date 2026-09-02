import assert from "node:assert/strict";
import test from "node:test";
import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";
import type { UploadPrivateAttachmentInput } from "../../../../attachments/domain/attachment";
import { uploadCaseAttachments } from "../uploadCaseAttachments";

test("uploads case and step files with exact revision ownership", async () => {
  const uploads: UploadPrivateAttachmentInput[] = [];
  const client = {
    async upload(input: UploadPrivateAttachmentInput) {
      uploads.push(input);
      return { id: `attachment-${uploads.length}`, projectId: input.projectId,
        owner: input.owner, kind: input.kind, originalFilename: input.file.name,
        mimeType: input.mimeType, trustedExtension: "png", byteSize: input.file.size,
        sha256: null, status: "ready", createdAt: "2026-09-02T00:00:00Z",
        updatedAt: "2026-09-02T00:00:00Z" } as const;
    },
    async getMetadata() { throw new Error("unused"); },
    async createAccess() { throw new Error("unused"); },
    async remove() { throw new Error("unused"); },
  } satisfies PrivateAttachmentClient;
  await uploadCaseAttachments({
    client, projectId: "project-1", caseId: "case-1", revisionNo: 3,
    operationKeyPrefix: "operation:evidence",
    attachments: [
      { id: "a", fieldKey: "description", file: new File(["a"], "case.png", { type: "image/png" }) },
      { id: "b", fieldKey: "step:s1:action", stepId: "s1", file: new File(["b"], "step.png", { type: "image/png" }) },
    ],
  });
  assert.deepEqual(uploads.map(({ owner }) => owner), [
    { kind: "test_case_revision", caseId: "case-1", revisionNo: 3 },
    { kind: "test_case_revision", caseId: "case-1", revisionNo: 3, stepId: "s1" },
  ]);
  assert.deepEqual(uploads.map(({ operationKey }) => operationKey), [
    "operation:evidence:0:0", "operation:evidence:1:0",
  ]);
});
