import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { AttachmentMetadata } from "../../../attachments/domain/attachment";
import { buildSelection, emptyBuildDraft, platformBuildError, type BuildDraft } from "../model/platform-build";
import { buildFileError, removeStagedBuild, uploadBuildError, uploadBuildFile } from "./build-upload";

type Upload = { controller: AbortController; finalizing: boolean; cancelled: boolean };
export function createBuildDraftStore(client: PrivateAttachmentClient | null, changed: () => void, ru: boolean) {
  let drafts: Record<string, BuildDraft> = {}; let disposed = false;
  const uploads = new Map<string, Upload>();
  const protectedIds = new Set<string>(); const retainedIds = new Set<string>();
  const removalKeys = new Map<string, string>();
  const unconfirmed = new Map<string, { file: File; operationKey: string }>();
  const current = (projectId: string) => drafts[projectId] ?? emptyBuildDraft();
  function patch(projectId: string, value: Partial<BuildDraft>) {
    drafts = { ...drafts, [projectId]: { ...current(projectId), ...value } };
    if (!disposed) changed();
  }
  function discard(artifact: AttachmentMetadata | null) {
    if (!artifact || !client || protectedIds.has(artifact.id)) return;
    const key = removalKeys.get(artifact.id) ?? crypto.randomUUID(); removalKeys.set(artifact.id, key);
    void removeStagedBuild(client, artifact, (id) => protectedIds.has(id), key).catch(() => {
      // The same deletion key safely retries a lost response; referenced builds remain server-protected.
      void removeStagedBuild(client, artifact, (id) => protectedIds.has(id), key).catch(() => {});
    });
  }
  function cancel(projectId: string) {
    const upload = uploads.get(projectId); if (!upload) return;
    upload.cancelled = true;
    // Once finalization starts, observe its result so a successfully stored orphan can be removed.
    if (!upload.finalizing) upload.controller.abort();
    uploads.delete(projectId);
    patch(projectId, { phase: "cancelled", error: "" });
  }
  function discardUnconfirmed(projectId: string) {
    const pending = unconfirmed.get(projectId); if (!pending || !client) return;
    unconfirmed.delete(projectId);
    void uploadBuildFile(client, projectId, pending.file, pending.operationKey, new AbortController().signal, () => {})
      .then(discard).catch(() => {});
  }
  async function start(projectId: string, file: File, operationKey: string) {
    if (!client || disposed || uploads.has(projectId)) return;
    const upload: Upload = { controller: new AbortController(), finalizing: false, cancelled: false };
    uploads.set(projectId, upload); patch(projectId, { phase: "preparing", error: "" });
    try {
      const artifact = await uploadBuildFile(client, projectId, file, operationKey, upload.controller.signal, (phase) => {
        if (phase === "finalizing") upload.finalizing = true;
        if (!upload.cancelled && !disposed) patch(projectId, { phase });
      });
      if (unconfirmed.get(projectId)?.operationKey === operationKey) unconfirmed.delete(projectId);
      if (upload.cancelled || disposed || uploads.get(projectId) !== upload) discard(artifact);
      else patch(projectId, { artifact, phase: "ready", error: "" });
    } catch (error) {
      if (upload.cancelled || disposed) {
        if (upload.finalizing) {
          // Finalization may have committed before its response was lost; replay only this upload.
          void uploadBuildFile(client, projectId, file, operationKey, new AbortController().signal, () => {})
            .then(discard).catch(() => {});
        }
      } else {
        if (upload.finalizing) unconfirmed.set(projectId, { file, operationKey });
        patch(projectId, { phase: "error", error: uploadBuildError(error, ru) });
      }
    } finally {
      if (uploads.get(projectId) === upload) uploads.delete(projectId);
      if (!disposed) changed();
    }
  }
  return {
    current, snapshot: () => drafts, uploading: () => uploads.size > 0,
    setAndroidVersion: (projectId: string, androidVersion: string) => patch(projectId, { androidVersion }),
    setIosReference: (projectId: string, iosReference: string) => patch(projectId, { iosReference }),
    chooseFile(projectId: string, file: File) {
      const error = buildFileError(file, ru);
      if (error || !client) { patch(projectId, { error: error || (ru ? "Загрузка недоступна." : "Upload is unavailable.") }); return; }
      cancel(projectId); discardUnconfirmed(projectId); discard(current(projectId).artifact);
      const operationKey = crypto.randomUUID();
      patch(projectId, { file, operationKey, artifact: null, error: "" }); void start(projectId, file, operationKey);
    },
    removeFile(projectId: string) {
      cancel(projectId); discardUnconfirmed(projectId); discard(current(projectId).artifact);
      patch(projectId, { file: null, artifact: null, operationKey: "", phase: "idle", error: "" });
    },
    retryUpload(projectId: string) {
      const draft = current(projectId);
      if (draft.file && !draft.artifact) void start(projectId, draft.file, draft.operationKey);
    },
    selection: (projectId: string) => buildSelection(current(projectId), projectId, ru),
    validationError(projectIds: readonly string[]) {
      return projectIds.map((id) => platformBuildError(current(id), id, ru)).find(Boolean) ?? "";
    },
    beginSubmission(projectIds: readonly string[]) {
      const ids = projectIds.flatMap((id) => current(id).artifact ? [current(id).artifact!.id] : []);
      ids.forEach((id) => protectedIds.add(id)); return ids;
    },
    settleSubmission(ids: readonly string[], outcome: "saved" | "uncertain" | "rejected") {
      ids.forEach((id) => {
        if (outcome !== "rejected") retainedIds.add(id);
        else if (!retainedIds.has(id)) protectedIds.delete(id);
      });
      if (disposed && outcome === "rejected") Object.values(drafts).forEach((draft) => discard(draft.artifact));
    },
    resume() { disposed = false; },
    dispose() {
      disposed = true;
      for (const id of uploads.keys()) cancel(id);
      for (const id of unconfirmed.keys()) discardUnconfirmed(id);
      Object.values(drafts).forEach((draft) => discard(draft.artifact));
    },
  };
}
