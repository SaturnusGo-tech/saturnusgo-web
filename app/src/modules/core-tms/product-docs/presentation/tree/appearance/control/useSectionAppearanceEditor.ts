"use client";

import { useEffect, useRef, useState } from "react";
import { useOptionalAttachmentClient } from "../../../../../attachments/presentation/context/AttachmentClientProvider";
import type { FolderAppearance } from "../../../../../folders/model/appearance/folder-appearance";
import type { FolderPickerEditor } from "../../../../../folders/presentation/appearance/picker/FolderAppearancePicker";

const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
const imageFormats = { accept: imageTypes.join(","), label: "PNG, JPG, WebP, GIF" };
const mimeByExtension = new Map<string, (typeof imageTypes)[number]>([
  ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["webp", "image/webp"], ["gif", "image/gif"],
] as const);

export function useSectionAppearanceEditor(projectId: string, appearance: FolderAppearance,
  save: (value: FolderAppearance) => void, ru: boolean): FolderPickerEditor {
  const client = useOptionalAttachmentClient();
  const [preview, setPreview] = useState<FolderAppearance>();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const request = useRef<AbortController>(null);
  const failed = useRef<{ value: FolderAppearance } | null>(null);
  const lastUpload = useRef<{ file: File; key: string } | null>(null);

  useEffect(() => () => request.current?.abort(), [projectId, save]);
  useEffect(() => { setPreview(undefined); }, [appearance]);

  function stopUpload() {
    request.current?.abort();
    request.current = null;
    setUploading(false);
  }

  function cancelUpload() {
    stopUpload();
    lastUpload.current = null;
    setError("");
  }

  function choose(value: FolderAppearance) {
    cancelUpload();
    setPreview(undefined);
    try {
      save(value);
      failed.current = null;
    } catch {
      failed.current = { value };
      setError(ru ? "Не удалось сохранить оформление в браузере." : "Could not save the appearance in this browser.");
    }
  }

  async function image(file: File, retrying = false) {
    if (!client) return;
    stopUpload();
    setError("");
    failed.current = null;
    const mimeType = file.type ? imageTypes.find(type => type === file.type)
      : mimeByExtension.get(file.name.split(".").pop()?.toLowerCase() ?? "");
    if (!mimeType || file.size < 1 || file.size > 10_485_760) {
      lastUpload.current = null;
      setError(ru ? "Выберите PNG, JPEG, WebP или GIF размером до 10 МБ." : "Choose a PNG, JPEG, WebP or GIF up to 10 MB.");
      return;
    }
    const key = retrying && lastUpload.current ? lastUpload.current.key : "doc-image:" + crypto.randomUUID();
    lastUpload.current = { file, key };
    const controller = new AbortController();
    request.current = controller;
    setUploading(true);
    try {
      const asset = await client.upload({ projectId, owner: { kind: "project", projectId },
        kind: "screenshot", mimeType, file, operationKey: key, signal: controller.signal });
      controller.signal.throwIfAborted();
      if (asset.status !== "ready") throw new Error("Incomplete image upload.");
      choose({ kind: "image", assetId: asset.id });
    } catch {
      if (!controller.signal.aborted) setError(ru ? "Не удалось загрузить изображение." : "Could not upload the image.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setUploading(false);
      }
    }
  }

  return {
    preview: preview === undefined ? appearance : preview, error, uploading, busy: false,
    failed: Boolean(failed.current), uploadFailed: Boolean(error && lastUpload.current), canUpload: Boolean(client),
    imageFormats, image, choose, cancelUpload,
    previewColor(value) { setPreview(value); },
    retry() { if (failed.current) choose(failed.current.value); },
    retryUpload() { if (lastUpload.current) void image(lastUpload.current.file, true); },
  };
}
