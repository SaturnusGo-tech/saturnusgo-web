import type { TestCase } from "../../../../../../core/tms/contracts/legacy-contract";
import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";
import type { CaseAttachmentProgress, PendingCaseAttachment } from "../pendingCaseAttachment";
import { uploadCaseAttachments } from "../uploadCaseAttachments";

type Resource = { data: TestCase; etag: string | null };
export type CaseSaveCheckpoint = { key: string; saved: Resource | null; completed: Set<string> };

// Keep the exact saved revision and file identities when a storage or refresh request fails.
export async function saveCaseWithAttachments(input: {
  checkpoint: CaseSaveCheckpoint;
  files: PendingCaseAttachment[];
  client: PrivateAttachmentClient;
  save: () => Promise<Resource>;
  reload: (id: string) => Promise<Resource>;
  onSaved?: () => void;
  onProgress?: CaseAttachmentProgress;
}) {
  const checkpoint = input.checkpoint;
  checkpoint.saved ??= await input.save();
  input.onSaved?.();
  const saved = checkpoint.saved.data;
  await uploadCaseAttachments({ client: input.client, projectId: saved.projectId,
    caseId: saved.id, revisionNo: saved.currentRevision, attachments: input.files,
    operationKeyPrefix: `${checkpoint.key}:evidence`, completed: checkpoint.completed,
    onProgress: input.onProgress });
  // Return only an authoritative resource containing the finalized attachment projections.
  return input.files.length ? input.reload(saved.id) : checkpoint.saved;
}
