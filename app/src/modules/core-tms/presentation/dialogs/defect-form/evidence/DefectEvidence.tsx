import { Button } from "@heroui/react";
import { Upload, Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { MAX_EVIDENCE_FILES } from "../../../../application/evidence/batch/evidenceBatchLimit";
import css from "./evidence.module.css";

export function DefectEvidence({ files, onChange, onAdd, disabled, dragging, limitExceeded }: {
  files: File[]; onChange: (files: File[]) => void; onAdd: (files: File[]) => void; disabled: boolean;
  dragging: boolean; limitExceeded: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <section className={css.evidence} data-dragging={dragging} aria-label={ru ? "Вложения" : "Attachments"}
    tabIndex={disabled ? -1 : 0} aria-disabled={disabled}>
    <div className={css.prompt}>
      <Upload className={css.upload} size={36} strokeWidth={1.25} aria-hidden="true" />
      <h3>{ru ? "Вложения" : "Attached files"}</h3>
      <p>{dragging ? (ru ? "Отпустите файлы, чтобы добавить" : "Drop files to attach")
        : (ru ? "Перетащите файлы сюда или вставьте из буфера" : "Drop files here or paste from your clipboard")}</p>
      <Button type="button" radius="full" size="sm" disableRipple isDisabled={disabled} className={css.add}
        onPress={() => input.current?.click()}>{ru ? "Добавить файлы" : "Add evidence"}</Button>
    </div>
    <input ref={input} hidden type="file" multiple disabled={disabled} aria-label={ru ? "Выбрать вложения" : "Choose attachments"}
      onChange={event => { if (!disabled) onAdd(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
    {limitExceeded && <p className={css.error} role="alert">{ru
      ? `Можно добавить до ${MAX_EVIDENCE_FILES} файлов. Уменьшите количество и повторите.`
      : `You can attach up to ${MAX_EVIDENCE_FILES} files. Choose fewer files and try again.`}</p>}
    {files.length > 0 && <ul className={css.files}>{files.map(file => <li key={`${file.name}:${file.size}:${file.lastModified}`}>
      <Paperclip size={13} /><span title={file.name}>{file.name}</span>
      <button type="button" disabled={disabled} aria-label={`${ru ? "Удалить файл" : "Remove file"} ${file.name}`}
        onClick={() => onChange(files.filter(item => item !== file))}><X size={14} /></button>
    </li>)}</ul>}
  </section>;
}
