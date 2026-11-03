import { useEffect, useMemo, useRef, useState } from "react";
import type { RepositoryFolder } from "../../model/folder";
import type { FolderAppearance } from "../../model/appearance/folder-appearance";
import { createAppearanceAutosave } from "../../application/appearance/appearance-autosave";
import { useFolderAppearanceContext } from "../appearance/folder-appearance-context";

export function useFolderAppearanceEditor(folder: RepositoryFolder) {
  const context = useFolderAppearanceContext(); const current = useRef(context); current.current = context;
  const [, update] = useState(0); const [local, setLocal] = useState<{ value: FolderAppearance } | null>(null);
  const [uploading, setUploading] = useState(false), [uploadError, setUploadError] = useState("");
  const upload = useRef<AbortController | null>(null), mounted = useRef(false);
  const lastUpload = useRef<{ file: File; key: string } | null>(null);
  const queue = useMemo(() => createAppearanceAutosave(folder, (value, appearance, key) => {
    if (!current.current.save) return Promise.reject(new Error("Folder customization is unavailable."));
    return current.current.save(value, appearance, key);
  }, () => update(v => v + 1)), [folder.workspaceId, folder.projectId, folder.id]);
  useEffect(() => { mounted.current = true; queue.activate(); setLocal(null); setUploading(false); setUploadError(""); return () => { mounted.current = false; upload.current?.abort(); queue.dispose(); }; }, [queue]);
  useEffect(() => { if (queue.synchronize(folder)) setLocal(null); }, [queue, folder.etag]);
  const state = queue.snapshot();
  function choose(appearance: FolderAppearance) { upload.current?.abort(); lastUpload.current = null; setUploading(false); setLocal(null); setUploadError(""); queue.choose(appearance); }
  async function image(file: File, retrying = false) {
    const job = retrying && lastUpload.current ? lastUpload.current : { file, key: crypto.randomUUID() }; lastUpload.current = job;
    upload.current?.abort(); const controller = new AbortController(); upload.current = controller;
    if (!current.current.upload) return;
    setUploading(true); setUploadError("");
    try {
      const assetId = await current.current.upload(state.confirmed, job.file, job.key, controller.signal);
      if (!controller.signal.aborted && mounted.current) { lastUpload.current = null; choose({ kind: "image", assetId }); }
    } catch (failure) {
      if (!controller.signal.aborted && mounted.current) setUploadError(failure instanceof Error ? failure.message : "Upload failed.");
    } finally { if (!controller.signal.aborted && mounted.current) setUploading(false); }
  }
  return { ...state, preview: local ? local.value : state.preview, uploading, error: uploadError || state.error,
    choose, previewColor: (value: FolderAppearance) => { upload.current?.abort(); lastUpload.current = null; setUploading(false); setLocal({ value }); }, retry: queue.retry, image,
    uploadFailed: Boolean(uploadError && lastUpload.current), retryUpload() { if (lastUpload.current) void image(lastUpload.current.file, true); },
    canUpload: Boolean(context.upload), cancelUpload() { upload.current?.abort(); lastUpload.current = null; setUploading(false); setUploadError(""); } };
}
