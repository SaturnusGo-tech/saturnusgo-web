import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { PendingCaseAttachment } from "../../../application/evidence/case/pendingCaseAttachment";
import { uploadEvidence } from "../../../application/evidence/uploadEvidence";
import type { SharedStep, SharedStepDraft } from "../../model/shared-step";

export type SharedStepSaveCheckpoint = {
  operationKey: string;
  saved: SharedStep | null;
  uploaded: Set<string>;
};

export async function saveSharedStepAssets(input: {
  draft: SharedStepDraft;
  entries: PendingCaseAttachment[];
  checkpoint: SharedStepSaveCheckpoint;
  client: PrivateAttachmentClient;
  save: (draft: SharedStepDraft, operationKey: string) => Promise<SharedStep | null>;
  reload: (id: string) => Promise<SharedStep>;
}) {
  const { checkpoint, draft, entries } = input;
  if (entries.length > 20 || entries.some(({ stepId }) => !draft.items.some((item) => item.id === stepId))) {
    throw new Error("Invalid shared-step attachment selection");
  }
  if (draft.items.some((item) => item.attachmentIds.length + entries.filter(({ stepId }) => stepId === item.id).length > 20)) {
    throw new Error("A step supports at most 20 attachments");
  }
  checkpoint.saved ??= await input.save(draft, checkpoint.operationKey);
  const saved = checkpoint.saved;
  if (!saved) throw new Error("Shared step was not saved");
  for (const entry of entries) {
    if (checkpoint.uploaded.has(entry.id)) continue;
    await uploadEvidence({ client: input.client, projectId: saved.projectId,
      owner: { kind: "shared_step_revision", sharedStepId: saved.id,
        revisionNo: saved.currentRevision, stepId: entry.stepId! },
      files: [entry.file], operationKeyPrefix: `${checkpoint.operationKey}:${entry.id}` });
    checkpoint.uploaded.add(entry.id);
  }
  return entries.length ? input.reload(saved.id) : saved;
}
