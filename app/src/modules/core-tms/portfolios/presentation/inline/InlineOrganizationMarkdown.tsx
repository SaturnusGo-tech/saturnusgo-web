import { useState } from "react";
import { MarkdownField } from "../../../presentation/cases/inspector/markdown/MarkdownField";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./inline-organization.module.css";

export function InlineOrganizationMarkdown({ label, value, placeholder, disabled, onSave }: {
  label: string; value: string; placeholder: string; disabled: boolean; onSave: (value: string) => Promise<boolean>;
}) {
  const { locale } = useTmsLocale();
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  async function save() {
    if (!disabled && draft !== null && draft.length <= 20000 && (draft === value || await onSave(draft))) setDraft(null);
  }
  return <section className={css.description} aria-label={label}>
    <h2>{label}</h2>
    <MarkdownField appearance="plain" label={label} value={draft ?? value} emptyLabel={placeholder} allowAttachments={false}
      autoFocus={editing} compact onRequestEdit={!disabled ? () => setDraft(value) : undefined}
      onChange={editing ? (value) => { if (!disabled) setDraft(value); } : undefined} />
    {editing && <div className={css.actions}>
      <button type="button" disabled={disabled || draft.length > 20000} onClick={() => void save()}>{locale === "ru" ? "Сохранить" : "Save"}</button>
      <button type="button" disabled={disabled} onClick={() => setDraft(null)}>{locale === "ru" ? "Отмена" : "Cancel"}</button>
      {draft.length > 20000 && <small role="alert">{locale === "ru" ? "До 20 000 символов." : "Up to 20,000 characters."}</small>}
    </div>}
  </section>;
}
