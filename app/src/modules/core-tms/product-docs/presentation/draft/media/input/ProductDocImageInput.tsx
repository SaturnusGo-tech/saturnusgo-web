"use client";

import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { Button } from "@heroui/react";
import { activeEditor$, currentSelection$, readOnly$, rootEditor$ } from "@mdxeditor/editor";
import { Cell, Signal, useCellValues, useRealm } from "@mdxeditor/gurx";
import { getNearestEditorFromDOMNode, type RangeSelection } from "lexical";
import { File as FileIcon, X } from "lucide-react";
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { attachmentFileName, maxProductDocAttachmentBytes, productDocAttachmentAccept, productDocMediaAccept } from "../../../../domain/attachments/productDocAttachment";
import { useUploadProductDocAttachment } from "../../../../state/attachments/useProductDocAttachment";
import { formatAttachmentSize } from "../../../../domain/attachments/formatAttachmentSize";
import attachmentStyles from "../../../attachments/product-doc-attachment.module.css";
import { ProductDocEmbedContext } from "../../../embeds/context/productDocEmbedContext";
import { captureImageTarget, insertProductDocAttachments, insertProductDocImages, type ProductDocImageTarget } from "../insertion/productDocImageInsertion";
import { directImageLink } from "../productDocImageSource";
import styles from "../image.module.css";

export const productDocMediaBusyCallback$ = Cell<((pending: boolean) => void) | undefined>(undefined);
export const productDocOpenAttachmentPicker$ = Signal<RangeSelection | null | void | { mediaOnly: true; selection?: RangeSelection | null }>();

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
  const [pending, setPending] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<"format" | "size" | "count" | "upload" | null>(null);
  const scope = useContext(ProductDocEmbedContext);
  const uploadAttachment = useUploadProductDocAttachment(scope);
  const { locale, languageTag } = useTmsLocale();
  const ru = locale === "ru";

  useEffect(() => {
    setPending(null);
    return () => {
      if (!request.current) return;
      request.current.abort();
      request.current = null;
      realm.getValue(productDocMediaBusyCallback$)?.(false);
    };
  }, [realm, scope]);
  useEffect(() => { if (readOnly) request.current?.abort(); }, [readOnly]);

  const upload = useCallback(async (files: File[], position: ProductDocImageTarget) => {
    if (request.current || !files.length) return;
    setError(null);
    const attachments = files.map((file) => ({ file, name: attachmentFileName(file) }));
    if (files.length > 20) { setError("count"); return; }
    if (attachments.some(({ name }) => !name)) { setError("format"); return; }
    if (files.some((file) => file.size < 1 || file.size > maxProductDocAttachmentBytes)) { setError("size"); return; }
    if (!uploadAttachment) { setError("upload"); return; }
    const controller = new AbortController();
    request.current = controller;
    realm.getValue(productDocMediaBusyCallback$)?.(true);
    const uploaded: string[] = [];
    try {
      for (const { file, name } of attachments) {
        if (controller.signal.aborted || !name) break;
        setPending({ name, size: file.size });
        try { uploaded.push(await uploadAttachment(file, name, crypto.randomUUID(), controller.signal)); }
        catch { if (!controller.signal.aborted) setError("upload"); }
      }
    } finally {
      try { if (!controller.signal.aborted) insertProductDocAttachments(position, uploaded); }
      finally {
        if (request.current === controller) {
          request.current = null;
          setPending(null);
          realm.getValue(productDocMediaBusyCallback$)?.(false);
        }
      }
    }
  }, [realm, uploadAttachment]);

  useLayoutEffect(() => realm.sub(productDocOpenAttachmentPicker$, (requestOptions) => {
    const editor = realm.getValue(activeEditor$) ?? root;
    if (editor && editor === root && editor.isEditable() && !request.current && input.current) {
      const mediaOnly = requestOptions && "mediaOnly" in requestOptions;
      const selection = mediaOnly ? requestOptions.selection : requestOptions;
      target.current = selection ? { editor, selection: selection.clone() }
        : captureImageTarget(editor, realm.getValue(currentSelection$));
      input.current.accept = mediaOnly ? productDocMediaAccept : productDocAttachmentAccept;
      input.current.click();
    }
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
      if (link) insertProductDocImages(captureImageTarget(editor), [link]);
      else if (root) void upload(files, captureImageTarget(root));
    }
    function drop(event: DragEvent) {
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (!files.length || !root?.isEditable()) return;
      event.preventDefault();
      event.stopPropagation();
      const range = dropRange(event);
      const editor = getNearestEditorFromDOMNode(event.target as Node);
      const inEditor = editor === root && range && root.getRootElement()?.contains(range.startContainer);
      void upload(files, captureImageTarget(root, null, inEditor ? range : null));
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
    format: ru ? "Выберите XLS, XLSX, DOCX, PDF, PNG, JPEG, HEIC, HEIF, WebP, GIF, MOV, MP3 или MP4."
      : "Choose an XLS, XLSX, DOCX, PDF, PNG, JPEG, HEIC, HEIF, WebP, GIF, MOV, MP3 or MP4 file.",
    size: ru ? "Выберите непустой файл до 25 МБ." : "Choose a non-empty file up to 25 MB.",
    count: ru ? "Можно прикрепить до 20 файлов за раз." : "Attach up to 20 files at a time.",
    upload: ru ? "Не все файлы удалось загрузить. Прикрепите их ещё раз." : "Some files couldn’t be uploaded. Attach them again.",
  };
  return <>
    <input hidden ref={input} type="file" multiple aria-label={ru ? "Прикрепить файл" : "Attach file"} accept={productDocAttachmentAccept} onChange={(event) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (target.current) void upload(files, target.current);
      target.current = null;
    }} />
    {pending && <div className={`${attachmentStyles.track} ${attachmentStyles.upload}`} role="status">
      <div className={attachmentStyles.file}>
        <div className={attachmentStyles.caption}>
          <FileIcon size={14} className={attachmentStyles.icon} aria-hidden="true" />
          <div className={attachmentStyles.identity}>
            <strong title={pending.name}>{pending.name}</strong>
            <span>{formatAttachmentSize(pending.size, languageTag, ru)}</span>
          </div>
          <div className={attachmentStyles.uploadStatus}>
            <LoadingOrb size="xs" />
            {ru ? "Загрузка…" : "Uploading…"}
          </div>
        </div>
      </div>
    </div>}
    {!pending && error && <div className={styles.feedback} role="alert">
      {failure[error]}
      <Button size="sm" variant="light" isIconOnly onPress={() => setError(null)} aria-label={ru ? "Закрыть" : "Dismiss"}>
        <X size={14} aria-hidden="true" /></Button>
    </div>}
  </>;
}
