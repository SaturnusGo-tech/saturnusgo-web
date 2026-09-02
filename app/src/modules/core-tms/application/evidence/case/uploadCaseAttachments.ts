import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import { MAX_PENDING_CASE_ATTACHMENTS, groupPendingCaseAttachments, type PendingCaseAttachment } from "./pendingCaseAttachment";
import { uploadEvidence } from "../uploadEvidence";

export async function uploadCaseAttachments(input: {
  client: PrivateAttachmentClient;
  projectId: string;
  caseId: string;
  revisionNo: number;
  attachments: PendingCaseAttachment[];
  operationKeyPrefix: string;
  signal?: AbortSignal;
}) {
  if (input.attachments.length > MAX_PENDING_CASE_ATTACHMENTS) {
    throw new Error(`A maximum of ${MAX_PENDING_CASE_ATTACHMENTS} case files can be uploaded together.`);
  }
  const uploaded = [];
  for (const [index, group] of groupPendingCaseAttachments(input.attachments).entries()) {
    uploaded.push(...await uploadEvidence({
      client: input.client,
      projectId: input.projectId,
      owner: {
        kind: "test_case_revision",
        caseId: input.caseId,
        revisionNo: input.revisionNo,
        ...(group.stepId ? { stepId: group.stepId } : {}),
      },
      files: group.files,
      operationKeyPrefix: `${input.operationKeyPrefix}:${index}`,
      signal: input.signal,
    }));
  }
  return uploaded;
}
