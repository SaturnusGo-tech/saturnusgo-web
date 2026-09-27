import { useEffect, useRef, useState } from "react";
import { useOptionalAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { createBuildDraftStore } from "../application/build-draft-store";

export function useRunPlatformBuilds(projectIds: readonly string[], offline: boolean, ru: boolean) {
  const client = useOptionalAttachmentClient();
  const [, refresh] = useState(0);
  const store = useRef<ReturnType<typeof createBuildDraftStore> | null>(null);
  if (!store.current) store.current = createBuildDraftStore(client, () => refresh((n) => n + 1), ru);
  const drafts = store.current;
  const [selectedProjectId, setProjectId] = useState(projectIds[0] ?? "");
  const projectId = projectIds.includes(selectedProjectId) ? selectedProjectId : projectIds[0] ?? "";
  useEffect(() => { drafts.resume(); return () => drafts.dispose(); }, [drafts]);
  const enabled = Boolean(projectId && client && !offline);
  return {
    projectId, setProjectId, drafts: drafts.snapshot(), current: drafts.current(projectId),
    uploading: drafts.uploading(), validationError: drafts.validationError(projectIds),
    setAndroidVersion: (value: string) => drafts.setAndroidVersion(projectId, value),
    setIosReference: (value: string) => drafts.setIosReference(projectId, value),
    chooseFile: (file: File) => { if (enabled) drafts.chooseFile(projectId, file); },
    removeFile: () => drafts.removeFile(projectId),
    retryUpload: () => { if (enabled) drafts.retryUpload(projectId); },
    cancelUpload: () => drafts.removeFile(projectId),
    selection: drafts.selection, validate: drafts.validationError,
    beginSubmission: drafts.beginSubmission, settleSubmission: drafts.settleSubmission,
  };
}
