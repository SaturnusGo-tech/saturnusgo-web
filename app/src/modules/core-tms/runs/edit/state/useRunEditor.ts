import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import type { useRunPlatformBuilds } from "../../builds/state/useRunPlatformBuilds";
import { createRunEditStore } from "../application/run-edit-store";
import { runEditApi } from "../data/run-edit-api";

/** The owning dialog is keyed by run ID; each edit starts with a fresh resource and ETag. */
export function useRunEditor(runId: string, projectId: string, ru: boolean) {
  const http = useTmsHttpClient(); const client = useOptionalAttachmentClient();
  const [, changed] = useState(0);
  const [store] = useState(() => createRunEditStore(runEditApi(http), client, runId, projectId, ru, () => changed(value => value + 1)));
  useEffect(() => { store.resume(); void store.load(); return () => store.dispose(); }, [store]);
  const builds = store.builds;
  const platformBuilds: ReturnType<typeof useRunPlatformBuilds> = {
    projectId, setProjectId: () => {}, current: builds.current(projectId), drafts: builds.snapshot(),
    uploading: builds.uploading(), validationError: builds.validationError([projectId]),
    setAndroidVersion: (value) => { if (store.fieldsEnabled()) builds.setAndroidVersion(projectId, value); },
    setIosReference: (value) => { if (store.fieldsEnabled()) builds.setIosReference(projectId, value); },
    chooseFile: (file) => { if (store.fieldsEnabled()) builds.chooseFile(projectId, file); },
    removeFile: () => { if (store.fieldsEnabled()) { builds.removeFile(projectId); builds.setAndroidVersion(projectId, ""); } },
    retryUpload: () => { if (store.fieldsEnabled()) builds.retryUpload(projectId); },
    cancelUpload: () => { if (store.fieldsEnabled()) builds.removeFile(projectId); },
    selection: builds.selection, validate: builds.validationError, beginSubmission: builds.beginSubmission, settleSubmission: builds.settleSubmission,
  };
  return { ...store.snapshot(), draftDirty: store.dirty(), fieldsEnabled: store.fieldsEnabled(),
    platformBuilds, patch: store.patch, reload: store.load, save: store.save };
}
