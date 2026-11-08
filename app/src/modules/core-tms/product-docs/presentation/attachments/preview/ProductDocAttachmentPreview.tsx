"use client";

import { Button } from "@heroui/react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useState } from "react";
import type { ProductDocAttachment } from "../../../domain/attachments/productDocAttachment";
import { ProductDocPdfPreview } from "./ProductDocPdfPreview";
import styles from "./attachment-preview.module.css";

export function ProductDocAttachmentPreview({ file, ru, expanded, onDocument, onRenew }: {
  file: ProductDocAttachment; ru: boolean; expanded?: boolean;
  onDocument?(pdf: PDFDocumentProxy | null): void; onRenew(): void;
}) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [failed, setFailed] = useState<string>();
  const preview = file.preview;
  const previewNote = preview?.truncated && <p className={styles.previewNote}>
    {ru ? "Показана часть файла. Полная версия доступна для скачивания." : "Partial preview. Download the original for the complete file."}
  </p>;
  if (failed === file.url) return <div className={styles.unavailable} role="status">
    <span>{ru ? "Предпросмотр недоступен. Файл можно скачать." : "Preview unavailable. You can download the original file."}</span>
    {Date.parse(file.expiresAt) <= Date.now() && <Button size="sm" variant="light" onPress={onRenew}>{ru ? "Повторить" : "Retry"}</Button>}
  </div>;
  if (preview?.type === "text") return <div className={styles.document} data-expanded={expanded || undefined} tabIndex={0}
    aria-label={file.filename}>{preview.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}{previewNote}</div>;
  if (preview?.type === "table" && preview.sheets.length) {
    const sheet = preview.sheets[sheetIndex] ?? preview.sheets[0];
    return <div className={styles.spreadsheet} data-expanded={expanded || undefined}>
      {preview.sheets.length > 1 && <div className={styles.sheets} aria-label={ru ? "Листы" : "Sheets"}>
        {preview.sheets.map(({ name }, index) => <Button key={index} size="sm" variant="light"
          aria-pressed={sheetIndex === index} onPress={() => setSheetIndex(index)}>{name}</Button>)}
      </div>}
      <div className={styles.cells} tabIndex={0} aria-label={sheet.name}>
        <table aria-label={sheet.name}><tbody>{sheet.rows.map((row, index) => <tr key={index}>
          <th scope="row">{index + 1}</th>{row.map((cell, column) => <td key={column}>{cell}</td>)}
        </tr>)}</tbody></table>
      </div>
      {previewNote}
    </div>;
  }
  if (file.kind === "pdf") return <ProductDocPdfPreview url={file.url} filename={file.filename} ru={ru}
    expanded={expanded} onDocument={onDocument} />;
  if (file.kind === "image") return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.image} src={file.url} alt={file.filename} loading="lazy" draggable={false}
      data-expanded={expanded || undefined} onError={() => setFailed(file.url)} />
  );
  if (file.kind === "video") return <video className={styles.video} src={file.url} aria-label={file.filename}
    controls playsInline preload="metadata" data-expanded={expanded || undefined} onError={() => setFailed(file.url)} />;
  if (file.kind === "audio") return <audio className={styles.audio} src={file.url} aria-label={file.filename}
    controls preload="metadata" onError={() => setFailed(file.url)} />;
  return <p className={styles.unavailable} role="status">{ru ? "Предпросмотр недоступен" : "Preview unavailable"}</p>;
}
