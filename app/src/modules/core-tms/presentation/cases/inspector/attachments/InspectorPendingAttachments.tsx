import { Paperclip, Upload, X } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import css from "../caseInspector.module.css";
import { useCaseAttachmentDraft } from "./CaseAttachmentDraftContext";

type Props = {
  locale: TmsLocale;
};

export function InspectorPendingAttachments({ locale }: Props) {
  const draft = useCaseAttachmentDraft();
  if (!draft?.enabled) return null;
  const ru = locale === "ru";
  return <div className={css.attachmentPicker}>
    <label>
      <Upload size={16} />
      <span>{ru ? "Добавить вложения" : "Add attachments"}</span>
      <input
        type="file"
        multiple
        onChange={(event) => {
          draft.add("case-files", Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />
    </label>
    {draft.entries.length > 0 && <div className={css.pendingFiles}>
      {draft.entries.map((entry) => <span key={entry.id}>
        <Paperclip size={13} /><b>{entry.file.name}</b>
        <button type="button" aria-label={`${ru ? "Удалить" : "Remove"} ${entry.file.name}`} onClick={() => draft.remove(entry.id)}><X size={13} /></button>
      </span>)}
    </div>}
    {draft.problem?.fieldKey === "case-files" && <span role="alert">{draft.problem.message}</span>}
  </div>;
}
