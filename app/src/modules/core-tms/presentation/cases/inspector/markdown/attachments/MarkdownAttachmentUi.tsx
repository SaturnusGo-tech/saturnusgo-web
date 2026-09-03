"use client";

import { FileText, Film, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PendingCaseAttachment } from "../../../../../application/evidence/case/pendingCaseAttachment";
import { AttachmentMediaFrame } from "../../../../../attachments/presentation/link/AttachmentMediaFrame";
import type { TmsLocale } from "../../../../../localization/model/locale";
import css from "../markdownField.module.css";

export function MarkdownAttachmentButton(props: {
  locale: TmsLocale;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = props.locale === "ru"
    ? "Добавить изображение, видео или файл"
    : "Attach image, video, or file";
  return <>
    <button className={css.attachmentButton} type="button" disabled={props.disabled}
      aria-label={label} onClick={() => inputRef.current?.click()}>
      <Paperclip size={15} />
    </button>
    <input ref={inputRef} className={css.hiddenFileInput} tabIndex={-1}
      type="file" multiple
      onChange={(event) => {
        props.onFiles(Array.from(event.currentTarget.files ?? []));
        event.currentTarget.value = "";
      }} />
  </>;
}

export function MarkdownPendingAttachments(props: {
  locale: TmsLocale;
  entries: PendingCaseAttachment[];
  onRemove: (id: string) => void;
  presentation?: "compact" | "media";
}) {
  if (props.entries.length === 0) return null;
  const remove = props.locale === "ru" ? "Удалить" : "Remove";
  if (props.presentation === "media") return <div className={css.pendingMediaGrid}
    aria-label={props.locale === "ru" ? "Новые вложения" : "New attachments"}>
    {props.entries.map((entry) => <PendingMediaAttachment key={entry.id} entry={entry}
      locale={props.locale} onRemove={() => props.onRemove(entry.id)} />)}
  </div>;
  return <div className={css.attachmentStrip} aria-label={props.locale === "ru" ? "Новые вложения" : "New attachments"}>
    {props.entries.map((entry) => <span className={css.attachmentChip} key={entry.id}>
      <AttachmentPreview file={entry.file} />
      <span><b>{entry.file.name}</b><small>{formatBytes(entry.file.size)}</small></span>
      <button type="button" onClick={() => props.onRemove(entry.id)}
        aria-label={`${remove} ${entry.file.name}`} title={`${remove} ${entry.file.name}`}>
        <X size={13} />
      </button>
    </span>)}
  </div>;
}

function PendingMediaAttachment({ entry, locale, onRemove }: {
  entry: PendingCaseAttachment;
  locale: TmsLocale;
  onRemove: () => void;
}) {
  const [source, setSource] = useState("");
  const mediaType = entry.file.type.startsWith("image/")
    ? "image"
    : entry.file.type.startsWith("video/") ? "video" : null;
  useEffect(() => {
    if (!mediaType) return;
    const url = URL.createObjectURL(entry.file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [entry.file, mediaType]);
  if (!mediaType) return <span className={css.attachmentChip}>
    <AttachmentPreview file={entry.file} />
    <span><b>{entry.file.name}</b><small>{formatBytes(entry.file.size)}</small></span>
    <button type="button" onClick={onRemove} aria-label={`${locale === "ru" ? "Удалить" : "Remove"} ${entry.file.name}`}>
      <X size={13} />
    </button>
  </span>;
  return <AttachmentMediaFrame
    name={entry.file.name}
    detail={formatBytes(entry.file.size)}
    source={source}
    mediaType={mediaType}
    locale={locale}
    onOpen={() => window.open(source, "_blank", "noopener,noreferrer")}
    onRemove={onRemove}
  />;
}

function AttachmentPreview({ file }: { file: File }) {
  const [source, setSource] = useState("");
  const image = file.type.startsWith("image/");
  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file, image]);
  if (image && source) return <img src={source} alt="" />;
  return file.type.startsWith("video/") ? <Film size={14} /> : <FileText size={14} />;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
