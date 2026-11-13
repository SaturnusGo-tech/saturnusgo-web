import { useEffect, useRef, useState } from "react";
import { MarkdownField } from "../markdown/MarkdownField";
import type { InspectorSection } from "../model";
import { InspectorSectionView } from "../section/InspectorSectionView";
import plain from "../markdown/plain/plainMarkdown.module.css";

type Props = {
  section: Extract<InspectorSection, "description" | "preconditions" | "testData">;
  title: string;
  value: string;
  ru: boolean;
  onChange: (value: string) => void;
  hideEdit?: boolean;
  disabled?: boolean;
  error?: string;
  allowAttachments?: boolean;
};

export function CreationNarrativeSection({ section, title, value, ru, onChange, hideEdit = false, disabled = false, error, allowAttachments }: Props) {
  const [editing, setEditing] = useState(false);
  const snapshot = useRef(value);
  useEffect(() => { if (error && !disabled) setEditing(true); }, [error, disabled]);
  const emptyLabel = section === "description"
    ? (ru ? "Описание не указано" : "No description")
    : section === "preconditions" ? (ru ? "Предусловия не указаны" : "No preconditions specified")
    : (ru ? "Тестовые данные не указаны" : "No test data specified");
  function edit() {
    if (disabled) return;
    snapshot.current = value;
    setEditing(true);
  }
  return <InspectorSectionView title={title} section={section} editing={editing && !disabled} ru={ru}
    hideEdit={hideEdit} disabled={disabled} onEdit={edit}
    onCancel={() => { if (!disabled) { onChange(snapshot.current); setEditing(false); } }}
    onSave={() => { if (!disabled) setEditing(false); }}>
    <MarkdownField appearance="plain" onRequestEdit={disabled ? undefined : edit} attachmentKey={section} value={value} label={title}
      allowAttachments={allowAttachments} editOnKeyboard={hideEdit} autoFocus={editing}
      onChange={editing && !disabled ? onChange : undefined} emptyLabel={emptyLabel} />
    {error && <small className={plain.error} role="alert">{error}</small>}
  </InspectorSectionView>;
}
