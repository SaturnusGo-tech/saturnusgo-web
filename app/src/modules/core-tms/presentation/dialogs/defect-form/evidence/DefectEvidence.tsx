import { Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { appendDefectFiles } from "../../defect-layout/files";
import css from "./evidence.module.css";

export function DefectEvidence({ files, onChange, disabled }: {
  files: File[]; onChange: (files: File[]) => void; disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <div className={css.evidence}
    onDragOver={event => event.preventDefault()}
    onDrop={event => { event.preventDefault(); if (!disabled) onChange(appendDefectFiles(files, Array.from(event.dataTransfer.files))); }}>
    <button type="button" className={css.attach} disabled={disabled} onClick={() => input.current?.click()}>
      <Paperclip size={16} />{ru ? "Прикрепить файлы" : "Attach files"}
    </button>
    <input ref={input} hidden type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" disabled={disabled}
      onChange={event => { onChange(appendDefectFiles(files, Array.from(event.currentTarget.files ?? []))); event.currentTarget.value = ""; }} />
    {files.length > 0 && <ul className={css.files}>{files.map(file => <li key={`${file.name}:${file.size}:${file.lastModified}`}>
      <Paperclip size={13} /><span title={file.name}>{file.name}</span>
      <button type="button" disabled={disabled} aria-label={`${ru ? "Удалить файл" : "Remove file"} ${file.name}`}
        onClick={() => onChange(files.filter(item => item !== file))}><X size={14} /></button>
    </li>)}</ul>}
  </div>;
}
