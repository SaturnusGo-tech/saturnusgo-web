"use client";

import { ErrorToast, showErrorToast } from "../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { addToast, Button, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { Download, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Link2, Maximize2, Printer, X } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { writeClipboardText } from "../../../../../shared/lib/clipboard";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { writeProductDocSelection } from "../../navigation/product-doc-link";
import { useProductDocAttachmentFile } from "../../state/attachments/useProductDocAttachment";
import { ProductDocMediaResize } from "../draft/media/resize/ProductDocImageResize";
import { ProductDocEmbedContext } from "../embeds/context/productDocEmbedContext";
import { ProductDocTooltip } from "../overlay/ProductDocTooltip";
import { formatAttachmentSize } from "../../domain/attachments/formatAttachmentSize";
import { ProductDocAttachmentPreview } from "./preview/ProductDocAttachmentPreview";
import { printProductDocPdf } from "./preview/rendering/productDocPdf";
import styles from "./product-doc-attachment.module.css";

const icons = { document: FileText, spreadsheet: FileSpreadsheet, pdf: FileText, image: FileImage, audio: FileAudio, video: FileVideo };

function AttachmentAction({ label, disabled, onPress, children }: {
  label: string; disabled?: boolean; onPress(): void; children: ReactNode;
}) {
  return <ProductDocTooltip label={label}><Button type="button" size="sm" variant="light" isIconOnly disableRipple
    isDisabled={disabled} className={styles.action} aria-label={label} onPress={onPress}>{children}</Button></ProductDocTooltip>;
}

export function ProductDocAttachment({ attachment, width, onWidthChange, onRemove }: {
  attachment: string; width?: number; onWidthChange?(width: number | "inherit"): void; onRemove?(): void;
}) {
  const { locale, languageTag } = useTmsLocale();
  const ru = locale === "ru";
  const reducedMotion = useReducedMotion();
  const scope = useContext(ProductDocEmbedContext);
  const { request, resource } = useProductDocAttachmentFile(scope, attachment);
  const file = resource.status === "ready" ? resource.data : null;
  const card = useRef<HTMLElement>(null);
  const printRequest = useRef<AbortController>(null);
  const [expanded, setExpanded] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [resized, setResized] = useState<number | null>(null);
  const pdf = useRef<PDFDocumentProxy | null>(null);
  const setDocument = useCallback((value: PDFDocumentProxy | null) => {
    pdf.current = value;
    setPdfReady(Boolean(value));
  }, []);
  useEffect(() => () => { printRequest.current?.abort(); }, []);
  useEffect(() => {
    if (!onRemove && attachment && window.location.hash === `#${attachment}`) {
      card.current?.scrollIntoView({ block: "center" });
    }
  }, [attachment, onRemove]);

  async function copyLink() {
    if (!scope) return;
    const url = writeProductDocSelection(new URL(window.location.href), { docId: scope.docId, version: scope.version });
    url.hash = attachment;
    try {
      await writeClipboardText(url.href);
      addToast({ title: ru ? "Ссылка на файл скопирована" : "File link copied", severity: "success" });
    } catch { showErrorToast({ message: ru ? "Не удалось скопировать ссылку" : "Couldn’t copy the file link" }); }
  }

  async function print() {
    if (!pdf.current || printRequest.current) return;
    const controller = new AbortController();
    printRequest.current = controller;
    setPrinting(true);
    try { await printProductDocPdf(pdf.current, controller.signal); }
    catch {
      if (!controller.signal.aborted) showErrorToast({ message: ru ? "Не удалось подготовить печать. Скачайте PDF." : "Couldn’t prepare to print. Download the PDF to print it." });
    } finally { printRequest.current = null; setPrinting(false); }
  }

  async function download() {
    if (!request || !file) return;
    try {
      const access = Date.parse(file.expiresAt) > Date.now() + 5000 ? file : await request(AbortSignal.timeout(10_000));
      const link = document.createElement("a");
      link.href = access.downloadUrl;
      link.download = access.filename;
      link.rel = "noreferrer";
      link.click();
    } catch { showErrorToast({ message: ru ? "Не удалось скачать файл" : "Couldn’t download the file" }); }
  }

  const Icon = file ? icons[file.kind] : FileText;
  const fileLabel = file?.filename ?? (ru ? "Вложение" : "Attachment");
  const printLabel = ru ? "Печать PDF" : "Print PDF";
  const downloadLabel = ru ? "Скачать оригинал" : "Download original";
  const expandLabel = ru ? "Раскрыть вложение" : "Expand attachment";
  const closeLabel = ru ? "Закрыть предпросмотр" : "Close preview";
  const size = file ? formatAttachmentSize(file.byteSize, languageTag, ru) : "";
  const canResize = Boolean(onWidthChange && file);
  return <div className={styles.track} data-doc-resize-canvas contentEditable={onRemove ? false : undefined}>
    <figure id={attachment || undefined} className={styles.file} ref={card} aria-label={fileLabel} style={{ width: resized ?? width }}
      data-file-kind={file?.kind} data-resizing={resized !== null || undefined}>
      <figcaption className={styles.caption}>
        <Icon size={14} className={styles.icon} aria-hidden="true" />
        <div className={styles.identity}><strong title={fileLabel}>{fileLabel}</strong>{file && <span>{size}</span>}</div>
        <div className={styles.actions}>
          {file && <>
            <AttachmentAction label={ru ? "Скопировать ссылку на файл" : "Copy file link"} onPress={() => void copyLink()}><Link2 size={16} /></AttachmentAction>
            {file.kind === "pdf"
              ? <AttachmentAction label={printLabel} disabled={!pdfReady || printing} onPress={() => void print()}>
                {printing ? <LoadingOrb /> : <Printer size={16} />}</AttachmentAction>
              : <AttachmentAction label={downloadLabel} onPress={() => void download()}><Download size={16} /></AttachmentAction>}
            <AttachmentAction label={expandLabel} onPress={() => setExpanded(true)}><Maximize2 size={16} /></AttachmentAction>
          </>}
          {onRemove && <AttachmentAction label={ru ? "Убрать файл из статьи" : "Remove file from article"} onPress={onRemove}><X size={16} /></AttachmentAction>}
        </div>
      </figcaption>
      {file ? <div className={styles.preview}><ProductDocAttachmentPreview file={file} ru={ru} onDocument={setDocument} onRenew={resource.retry} /></div>
        : !request || resource.status === "error" ? <ErrorToast message={ru ? "Вложение недоступно" : "Attachment unavailable"}
          retryLabel={ru ? "Повторить" : "Retry"} onRetry={request ? resource.retry : undefined} /> : <div role="status" className={styles.message} aria-label={ru ? "Загрузка вложения" : "Loading attachment"}><LoadingOrb size="md" /></div>}
      {canResize && onWidthChange && <ProductDocMediaResize media={card} className={styles.resize} canvasSelector="[data-doc-resize-canvas]"
        centered minWidth={file?.kind === "image" ? 120 : 180} label={ru ? "Изменить размер вложения" : "Resize attachment"} onResize={setResized} onCommit={onWidthChange} />}
    </figure>
    {file && <Modal isOpen={expanded} onClose={() => setExpanded(false)} placement="center" size="5xl" hideCloseButton
      disableAnimation={Boolean(reducedMotion)}
      scrollBehavior="inside" classNames={{ wrapper: styles.modalWrapper, backdrop: styles.modalBackdrop, base: styles.modal }}>
      <ModalContent data-editor-dialog>
        <ModalHeader className={styles.modalHeader}><span title={fileLabel}>{fileLabel}</span>
          <div className={styles.actions}>
            <AttachmentAction label={downloadLabel} onPress={() => void download()}><Download size={16} /></AttachmentAction>
            <AttachmentAction label={closeLabel} onPress={() => setExpanded(false)}><X size={17} /></AttachmentAction>
          </div>
        </ModalHeader>
        <ModalBody className={styles.modalBody}><ProductDocAttachmentPreview file={file} ru={ru} expanded onRenew={resource.retry} /></ModalBody>
      </ModalContent>
    </Modal>}
  </div>;
}
