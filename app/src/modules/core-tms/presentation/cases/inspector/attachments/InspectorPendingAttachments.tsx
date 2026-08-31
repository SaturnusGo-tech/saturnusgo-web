import { Paperclip, Upload, X } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import css from "../caseInspector.module.css";

type Props = {
  locale: TmsLocale;
  files: File[];
  onFiles: (files: File[]) => void;
};

export function InspectorPendingAttachments({ locale, files, onFiles }: Props) {
  const ru = locale === "ru";
  return <div className={css.attachmentPicker}>
    <label>
      <Upload size={16} />
      <span>{ru ? "Добавить вложения" : "Add attachments"}</span>
      <input
        type="file"
        multiple
        accept="image/*,video/*,.log,.txt,.pdf"
        onChange={(event) => {
          onFiles([...files, ...Array.from(event.target.files ?? [])]);
          event.currentTarget.value = "";
        }}
      />
    </label>
    {files.length > 0 && <div className={css.pendingFiles}>
      {files.map((file) => <span key={`${file.name}-${file.lastModified}`}>
        <Paperclip size={13} /><b>{file.name}</b>
        <button type="button" aria-label={`${ru ? "Удалить" : "Remove"} ${file.name}`} onClick={() => onFiles(files.filter((item) => item !== file))}><X size={13} /></button>
      </span>)}
    </div>}
  </div>;
}
