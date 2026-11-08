"use client";

import { activeEditor$, closeImageDialog$, currentSelection$, openNewImageDialog$,
  readOnly$, rootEditor$ } from "@mdxeditor/editor";
import { Cell, useCellValues, useRealm } from "@mdxeditor/gurx";
import { getNearestEditorFromDOMNode } from "lexical";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOptionalAttachmentClient } from "../../../../../attachments/presentation/context/AttachmentClientProvider";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useProductDocsWorkspace } from "../../../../composition/context/ProductDocsContext";
import { imageAttachmentReference } from "../codec/productDocImageReference";
import { captureImageTarget, insertProductDocImages, type ProductDocImageTarget } from "../insertion/productDocImageInsertion";
import { directImageLink } from "../productDocImageSource";
import styles from "../image.module.css";

const types = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
const maxBytes = 25 * 1024 * 1024;
const byExtension = { png: types[0], jpg: types[1], jpeg: types[1], webp: types[2], gif: types[3] } as const;
export const productDocMediaBusyCallback$ = Cell<((pending: boolean) => void) | undefined>(undefined);

function fileMime(file: File) {
  return file.type
    ? types.find((type) => type === file.type)
    : byExtension[file.name.split(".").pop()?.toLowerCase() as keyof typeof byExtension];
}

function dropRange(event: DragEvent) {
  const point = document.caretPositionFromPoint?.(event.clientX, event.clientY);
  if (point) {
    const range = document.createRange();
    range.setStart(point.offsetNode, point.offset);
    range.collapse(true);
    return range;
  }
  return document.caretRangeFromPoint?.(event.clientX, event.clientY) ?? null;
}

export function ProductDocImageInput() {
  const realm = useRealm();
  const [root, readOnly] = useCellValues(rootEditor$, readOnly$);
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<ProductDocImageTarget>(null);
  const request = useRef<AbortController>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"format" | "size" | "count" | "upload" | null>(null);
  const client = useOptionalAttachmentClient();
  const scope = useProductDocsWorkspace()?.scope;
  const projectId = scope?.projectId;
  const workspaceId = scope?.workspaceId;
  const ru = useTmsLocale().locale === "ru";

  useEffect(() => {
    setPending(false);
    return () => {
      if (!request.current) return;
      request.current.abort();
      request.current = null;
      realm.getValue(productDocMediaBusyCallback$)?.(false);
    };
  }, [realm, workspaceId, projectId]);
  useEffect(() => { if (readOnly) request.current?.abort(); }, [readOnly]);

  const upload = useCallback(async (files: File[], position: ProductDocImageTarget) => {
    if (request.current || !files.length) return;
    setError(null);
    if (files.length > 20) { setError("count"); return; }
    if (files.some((file) => !fileMime(file))) { setError("format"); return; }
    if (files.some((file) => file.size < 1 || file.size > maxBytes)) { setError("size"); return; }
    if (!client || !projectId) { setError("upload"); return; }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    realm.getValue(productDocMediaBusyCallback$)?.(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        controller.signal.throwIfAborted();
        const result = await client.upload({
          projectId, owner: { kind: "project", projectId }, kind: "screenshot", mimeType: fileMime(file)!,
          file, operationKey: "doc-image:" + crypto.randomUUID(), signal: controller.signal,
        });
        if (result.status !== "ready") throw new Error("Image upload is incomplete");
        uploaded.push(imageAttachmentReference(result.id));
      }
    } catch {
      if (!controller.signal.aborted) setError("upload");
    } finally {
      try {
        if (!controller.signal.aborted) insertProductDocImages(position, uploaded);
      } finally {
        if (request.current === controller) {
          request.current = null;
          setPending(false);
          realm.getValue(productDocMediaBusyCallback$)?.(false);
        }
      }
    }
  }, [client, projectId, realm]);

  useLayoutEffect(() => realm.sub(openNewImageDialog$, () => {
    const editor = realm.getValue(activeEditor$) ?? root;
    if (editor?.isEditable() && !request.current) {
      target.current = captureImageTarget(editor, realm.getValue(currentSelection$));
      input.current?.click();
    }
    realm.pub(closeImageDialog$, undefined);
  }), [realm, root]);

  useLayoutEffect(() => {
    function dragover(event: DragEvent) {
      if (!readOnly && event.dataTransfer?.types.includes("Files")) event.preventDefault();
    }
    function paste(event: ClipboardEvent) {
      if (event.target instanceof Element && event.target.closest("input, textarea")) return;
      const editor = getNearestEditorFromDOMNode(event.target as Node) ?? root;
      if (!editor?.isEditable() || !event.clipboardData) return;
      const files = Array.from(event.clipboardData.files);
      const link = files.length ? null : directImageLink(event.clipboardData.getData("text/plain"));
      if (!files.length && !link) return;
      event.preventDefault();
      event.stopPropagation();
      const position = captureImageTarget(editor);
      if (link) insertProductDocImages(position, [link]);
      else void upload(files, position);
    }
    function drop(event: DragEvent) {
      const files = Array.from(event.dataTransfer?.files ?? []);
      const editor = getNearestEditorFromDOMNode(event.target as Node) ?? root;
      if (!files.length || !editor?.isEditable()) return;
      event.preventDefault();
      event.stopPropagation();
      const range = dropRange(event);
      const inEditor = range && editor.getRootElement()?.contains(range.startContainer);
      void upload(files, captureImageTarget(editor, null, inEditor ? range : null));
    }
    return root?.registerRootListener((element, previous) => {
      previous?.removeEventListener("paste", paste, true);
      previous?.removeEventListener("dragover", dragover, true);
      previous?.removeEventListener("drop", drop, true);
      element?.addEventListener("paste", paste, true);
      element?.addEventListener("dragover", dragover, true);
      element?.addEventListener("drop", drop, true);
    });
  }, [readOnly, root, upload]);

  const failure = {
    format: ru ? "Выберите изображение PNG, JPEG, WebP или GIF." : "Choose a PNG, JPEG, WebP or GIF image.",
    size: ru ? "Размер изображения должен быть от 1 байта до 25 МБ." : "Choose an image up to 25 MB.",
    count: ru ? "Можно вставить до 20 изображений за раз." : "Insert up to 20 images at a time.",
    upload: ru ? "Не удалось загрузить изображение. Попробуйте снова." : "Couldn't upload the image. Try again.",
  };
  return <>
    <input hidden ref={input} type="file" multiple accept={types.join(",")} onChange={(event) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (target.current) void upload(files, target.current);
      target.current = null;
    }} />
    {(pending || error) && <div className={styles.feedback} role={error ? "alert" : "status"}>
      {pending ? (ru ? "Загрузка изображений…" : "Uploading images…") : error && failure[error]}
      {!pending && <button type="button" onClick={() => setError(null)} aria-label={ru ? "Закрыть" : "Dismiss"}>×</button>}
    </div>}
  </>;
}
