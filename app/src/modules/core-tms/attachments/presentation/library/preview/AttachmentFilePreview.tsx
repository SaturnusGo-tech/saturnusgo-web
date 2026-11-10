"use client";

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { ChevronDown, Download, File, FileArchive, FileText, Grid2X2, Image, Music2, Video, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { ProductDocPdfPreview } from "../../../../product-docs/presentation/attachments/preview/ProductDocPdfPreview";
import { getFilePreviewKind, type FilePreviewKind, type FilePreviewRequest, type ParsedFilePreview } from "./model/file-preview-format";
import { ArchivePreview } from "./archive/ArchivePreview";
import { SpreadsheetPreview } from "./SpreadsheetPreview";
import styles from "./attachment-file-preview.module.css";

const SourceFilePreview = lazy(() => import("./source/SourceFilePreview"));

export type PreviewFile = { id: string; filename: string; mimeType: string; sizeBytes?: number | null };

type Props = {
  file: PreviewFile;
  loadFile: (signal: AbortSignal) => Promise<Blob>;
  loadDocumentText?: (signal: AbortSignal) => Promise<{ paragraphs: string[]; truncated?: boolean }>;
  onClose: () => void;
  onDownload?: () => void;
  ru?: boolean;
};

type Preview = ParsedFilePreview | { kind: "image" | "video" | "audio"; url: string }
  | { kind: "pdf"; blob: Blob }
  | { kind: "document"; paragraphs: string[]; truncated?: boolean };
type PreviewState = { state: "loading" } | { state: "unavailable" } | { state: "ready"; preview: Preview; blob?: Blob };
const maxPreviewBytes = 64 * 1024 * 1024;
const zoomOptions = [50, 75, 100, 125, 150, 200];

const icons = { sheet: Grid2X2, pdf: FileText, image: Image, video: Video, audio: Music2, text: FileText, document: FileText, archive: FileArchive, unsupported: File };

function parseInWorker(request: FilePreviewRequest, signal: AbortSignal): Promise<ParsedFilePreview> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const worker = new Worker(new URL("./worker/file-preview.worker.ts", import.meta.url), { type: "module" });
    const finish = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => { finish(); reject(signal.reason); };
    const fail = () => { finish(); reject(new Error("File preview unavailable")); };
    const timeout = window.setTimeout(fail, 15_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ data?: ParsedFilePreview }>) => {
      if (event.data.data) { finish(); resolve(event.data.data); }
      else fail();
    };
    worker.onerror = fail;
    worker.onmessageerror = fail;
    try { worker.postMessage(request); }
    catch { fail(); }
  });
}

function ArchiveContent({ preview, blob, filename, ru }: {
  preview: Extract<ParsedFilePreview, { kind: "archive" }>; blob: Blob; filename: string; ru: boolean;
}) {
  const openEntry = useCallback(async (entry: (typeof preview.entries)[number], signal: AbortSignal) => {
    const result = await parseInWorker({ kind: "archive-entry", filename: entry.name, blob }, signal);
    if (result.kind !== "text") throw new Error("Archive entry preview unavailable");
    return result;
  }, [blob]);
  return <ArchivePreview {...preview} filename={filename} ru={ru} openEntry={openEntry} />;
}

function PreviewContent({ preview, blob, file, zoom, ru, onFailure }: {
  preview: Preview; blob?: Blob; file: PreviewFile; zoom: number; ru: boolean; onFailure: () => void;
}) {
  if (preview.kind === "sheet") return <SpreadsheetPreview sheets={preview.sheets} limited={preview.limited} scale={zoom / 100} ru={ru} />;
  if (preview.kind === "archive") return blob ? <ArchiveContent preview={preview} blob={blob} filename={file.filename} ru={ru} /> : null;
  if (preview.kind === "text") return <Suspense fallback={<div className={styles.unavailable}>
    <LoadingOrb size="md" label={ru ? "Открываем файл" : "Opening file"} />
  </div>}>
    <SourceFilePreview {...preview} filename={file.filename} mimeType={file.mimeType} ru={ru} />
  </Suspense>;
  if (preview.kind === "document") return <div className={styles.document} tabIndex={0} aria-label={file.filename}>
    {preview.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {preview.truncated && <p className={styles.limit}>{ru ? "Показана часть документа" : "Partial document preview"}</p>}
  </div>;
  if (preview.kind === "pdf") return <div className={styles.pdf}>
    <ProductDocPdfPreview blob={preview.blob} filename={file.filename} ru={ru} viewportScale={zoom / 100} />
  </div>;
  if (preview.kind === "image") return <div className={styles.pictureViewport} tabIndex={0}>
    <img className={styles.picture} src={preview.url} alt={file.filename} style={{ "--preview-zoom": zoom / 100 } as React.CSSProperties}
      onLoad={({ currentTarget }) => {
        currentTarget.style.setProperty("--preview-aspect", String(currentTarget.naturalWidth / currentTarget.naturalHeight));
      }}
      onError={onFailure} />
  </div>;
  if (preview.kind === "video") return <div className={styles.media}>
    <video src={preview.url} controls playsInline preload="metadata" aria-label={file.filename} onError={onFailure} />
  </div>;
  return <div className={styles.media}>
    <audio src={preview.url} controls preload="metadata" aria-label={file.filename} onError={onFailure} />
  </div>;
}

function PreviewBody({ file, loadFile, loadDocumentText, onClose, onDownload, ru = false, kind }: Props & { kind: FilePreviewKind | "document" }) {
  const [result, setResult] = useState<PreviewState>({ state: "loading" });
  const [zoom, setZoom] = useState(100);
  const closeButton = useRef<HTMLButtonElement>(null);
  const filename = file.filename;
  const Icon = icons[kind];
  const oversized = (file.sizeBytes ?? 0) > maxPreviewBytes;
  const supported = kind !== "unsupported" && !oversized;

  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!supported) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setResult({ state: "loading" });
    async function prepare() {
      if (kind === "unsupported") return;
      if (kind === "document") {
        if (!loadDocumentText) throw new Error("Document preview unavailable");
        const content = await loadDocumentText(controller.signal);
        if (!controller.signal.aborted) setResult({ state: "ready", preview: { ...content, kind } });
        return;
      }
      const blob = await loadFile(controller.signal);
      controller.signal.throwIfAborted();
      if (blob.size > maxPreviewBytes) throw new Error("File exceeds preview limit");
      let preview: Preview;
      if (kind === "sheet" || kind === "text" || kind === "archive") {
        preview = await parseInWorker({ kind, filename, blob, mimeType: file.mimeType }, controller.signal);
      } else if (kind === "pdf") {
        preview = { kind, blob };
      } else {
        objectUrl = URL.createObjectURL(blob);
        preview = { kind, url: objectUrl };
      }
      if (!controller.signal.aborted) setResult({ state: "ready", preview, blob });
    }
    void prepare().catch(() => { if (!controller.signal.aborted) setResult({ state: "unavailable" }); });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.mimeType, filename, kind, loadFile, loadDocumentText, supported]);

  function download() {
    if (onDownload) { onDownload(); return; }
    if (result.state !== "ready" || !result.blob) return;
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  const showZoom = result.state === "ready" && (kind === "sheet" || kind === "pdf" || kind === "image");
  const unavailable = ru ? "Предпросмотр недоступен" : "Preview unavailable";
  const description = oversized
    ? ru ? "Скачайте файл, чтобы просмотреть его целиком." : "Download this file to view it in full."
    : ru ? "Файл можно скачать и открыть на устройстве." : "You can download this file and open it on your device.";

  return <section className={styles.viewer} aria-label={filename}
    onKeyDown={event => { if (event.key === "Escape" && !event.defaultPrevented) { event.stopPropagation(); onClose(); } }}>
    <div className={styles.toolbar}>
      <div className={styles.filename} title={filename}><Icon size={16} aria-hidden="true" /><span>{filename}</span></div>
      <div className={styles.toolbarActions}>
        {showZoom && <Dropdown placement="bottom-end" classNames={{ content: styles.zoomMenu }}>
          <DropdownTrigger>
            <Button size="sm" radius="full" className={styles.toolbarButton} aria-label={ru ? `Масштаб ${zoom}%` : `Zoom ${zoom}%`} endContent={<ChevronDown size={13} />}>{zoom}%</Button>
          </DropdownTrigger>
          <DropdownMenu aria-label={ru ? "Масштаб" : "Zoom"} selectionMode="single" disallowEmptySelection
            selectedKeys={[String(zoom)]} onAction={key => setZoom(Number(key))}>
            {zoomOptions.map(option => <DropdownItem key={String(option)}>{option}%</DropdownItem>)}
          </DropdownMenu>
        </Dropdown>}
        <Button size="sm" isIconOnly radius="full" className={styles.toolbarButton} isDisabled={!onDownload && (result.state !== "ready" || !result.blob)}
          onPress={download} aria-label={ru ? "Скачать" : "Download"} title={ru ? "Скачать" : "Download"}><Download size={16} /></Button>
        <Button ref={closeButton} size="sm" isIconOnly radius="full" className={styles.toolbarButton}
          onPress={onClose} aria-label={ru ? "Закрыть предпросмотр" : "Close preview"} title={ru ? "Закрыть предпросмотр" : "Close preview"}><X size={17} /></Button>
      </div>
    </div>
    {!supported || result.state === "unavailable"
      ? <div className={styles.unavailable} role="status"><Icon size={28} aria-hidden="true" /><h2>{unavailable}</h2><p>{description}</p></div>
      : result.state === "loading" ? <div className={styles.unavailable}><LoadingOrb size="lg" label={ru ? "Открываем файл" : "Opening file"} /></div>
      : <PreviewContent preview={result.preview} blob={result.blob} file={file} zoom={zoom} ru={ru} onFailure={() => setResult({ state: "unavailable" })} />}
  </section>;
}

export function AttachmentFilePreview(props: Props) {
  const kind = props.loadDocumentText ? "document" : getFilePreviewKind(props.file.filename, props.file.mimeType);
  return <PreviewBody key={props.file.id} {...props} kind={kind} />;
}
