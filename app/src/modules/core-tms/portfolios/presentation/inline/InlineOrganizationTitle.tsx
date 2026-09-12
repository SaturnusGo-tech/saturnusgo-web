import { useState } from "react";
import { PiCheck, PiX } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./inline-organization.module.css";

export function InlineOrganizationTitle({ value, label, disabled, onSave }: {
  value: string; label: string; disabled: boolean; onSave: (value: string) => Promise<boolean>;
}) {
  const { locale } = useTmsLocale();
  const [draft, setDraft] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const invalid = draft !== null && (!draft.trim() || draft.trim().length > 120);
  async function save() {
    setAttempted(true);
    if (!disabled && draft !== null && !invalid && (draft.trim() === value || await onSave(draft.trim()))) setDraft(null);
  }
  return <div className={css.title}>
    {draft === null ? <h1><button type="button" disabled={disabled} onClick={() => { setDraft(value); setAttempted(false); }} aria-label={`${locale === "ru" ? "Изменить" : "Edit"}: ${label}`}>{value}</button></h1>
      : <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <input autoFocus aria-label={label} value={draft} maxLength={120} disabled={disabled} aria-invalid={attempted && invalid}
          onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && !disabled) { event.preventDefault(); setDraft(null); } }} />
        <button type="submit" disabled={disabled} aria-label={locale === "ru" ? "Сохранить название" : "Save title"}><PiCheck /></button>
        <button type="button" disabled={disabled} onClick={() => setDraft(null)} aria-label={locale === "ru" ? "Отмена" : "Cancel"}><PiX /></button>
      </form>}
    {attempted && invalid && <small role="alert">{locale === "ru" ? "Укажите название — до 120 символов." : "Enter a title, up to 120 characters."}</small>}
  </div>;
}
