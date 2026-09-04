import { Upload } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MarkdownPendingAttachments } from "../markdown/attachments/MarkdownAttachmentUi";
import css from "../caseInspector.module.css";
import { useCaseAttachmentDraft } from "./CaseAttachmentDraftContext";

type Props = {
  locale: TmsLocale;
  includeStepFiles?: boolean;
};

export function InspectorPendingAttachments({ locale, includeStepFiles = false }: Props) {
  const draft = useCaseAttachmentDraft();
  if (!draft?.enabled) return null;
  const ru = locale === "ru";
  const entries = includeStepFiles
    ? draft.entries
    : draft.entries.filter((entry) => entry.fieldKey === "case-files");
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
    {entries.length > 0 && <MarkdownPendingAttachments locale={locale} entries={entries}
      onRemove={draft.remove} presentation="media" />}
    {draft.problem?.fieldKey === "case-files" && <span role="alert">{draft.problem.message}</span>}
  </div>;
}
