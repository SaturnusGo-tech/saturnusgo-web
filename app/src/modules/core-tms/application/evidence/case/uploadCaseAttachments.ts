import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import { MAX_PENDING_CASE_ATTACHMENTS, type CaseAttachmentProgress, type PendingCaseAttachment } from "./pendingCaseAttachment";
import { uploadEvidence } from "../uploadEvidence";

export async function uploadCaseAttachments(input: {
  client: PrivateAttachmentClient;
  projectId: string;
  caseId: string;
  revisionNo: number;
  attachments: PendingCaseAttachment[];
  operationKeyPrefix: string;
  signal?: AbortSignal;
  completed?: Set<string>;
  onProgress?: CaseAttachmentProgress;
}) {
  if (input.attachments.length > MAX_PENDING_CASE_ATTACHMENTS) {
    throw new Error(`A maximum of ${MAX_PENDING_CASE_ATTACHMENTS} case files can be uploaded together.`);
  }
  const uploaded = [];
  for (const entry of input.attachments) {
    if (input.completed?.has(entry.id)) { input.onProgress?.(entry.id, "ready"); continue; }
    try { uploaded.push(...await uploadEvidence({
      client: input.client,
      projectId: input.projectId,
      owner: {
        kind: "test_case_revision",
        caseId: input.caseId,
        revisionNo: input.revisionNo,
        ...(entry.stepId ? { stepId: entry.stepId } : {}),
      },
      files: [entry.file],
      operationKeyPrefix: `${input.operationKeyPrefix}:${entry.id}`,
      signal: input.signal,
      onProgress: (_, phase) => input.onProgress?.(entry.id, phase),
    }));
      input.completed?.add(entry.id);
      input.onProgress?.(entry.id, "ready");
    } catch (error) { input.onProgress?.(entry.id, "error"); throw error; }
  }
  return uploaded;
}
