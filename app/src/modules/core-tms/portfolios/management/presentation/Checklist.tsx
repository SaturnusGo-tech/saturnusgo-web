import { useState } from "react";
import { PiCheck, PiListChecks, PiPencilSimple, PiPlus, PiTrash, PiX } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { organizationCopy } from "../model/copy";
import type { ChecklistItem } from "../model/organization";
import css from "./management.module.css";
export function Checklist({ items = [], disabled = false, readOnly = false, onChange }: {
  items?: readonly ChecklistItem[]; disabled?: boolean; readOnly?: boolean;
  onChange: (items: readonly ChecklistItem[]) => void | Promise<boolean>;
}) {
  const { locale } = useTmsLocale();
  const copy = organizationCopy(locale);
  const [expanded, setExpanded] = useState(items.length > 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  async function save() {
    const value = text.trim();
    if (!value || value.length > 500 || disabled) return;
    const next = editing ? items.map((item) => item.id === editing ? { ...item, text: value } : item)
      : [...items, { id: draftId, text: value, completed: false }];
    if (next.length > 100) return;
    if (await onChange(next) !== false) { setText(""); setEditing(null); setDraftId(crypto.randomUUID()); }
  }
  if (readOnly && !items.length) return null;
  return <section data-organization-checklist className={css.checklist} aria-label={copy.checklist}>
    <button type="button" className={css.action} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <PiListChecks aria-hidden="true" />{copy.checklist}{items.length > 0 && <span>{items.filter((item) => item.completed).length}/{items.length}</span>}
    </button>
    {expanded && <div className={css.checklistBody}>
      <ul>{items.map((item) => <li key={item.id}>
        <label><input type="checkbox" checked={item.completed} disabled={readOnly || disabled}
          onChange={() => void onChange(items.map((entry) => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry))} />
          <span data-completed={item.completed}>{item.text}</span></label>
        {!readOnly && <div><button type="button" className={css.icon} aria-label={`${copy.edit}: ${item.text}`} disabled={disabled}
          onClick={() => { setEditing(item.id); setText(item.text); }}><PiPencilSimple /></button>
          <button type="button" className={css.icon} disabled={disabled} aria-label={`${copy.remove}: ${item.text}`}
            onClick={() => void onChange(items.filter((entry) => entry.id !== item.id))}><PiTrash /></button></div>}
      </li>)}</ul>
      {!readOnly && (items.length < 100 || editing) && <div className={css.newItem}>
        <input aria-label={copy.item} placeholder={copy.item} maxLength={500} value={text} disabled={disabled}
          onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void save(); } }} />
        <button type="button" className={css.icon} disabled={disabled || !text.trim()} aria-label={editing ? copy.done : copy.addItem} onClick={() => void save()}>{editing ? <PiCheck /> : <PiPlus />}</button>
        {editing && <button type="button" className={css.icon} aria-label={copy.cancel} onClick={() => { setEditing(null); setText(""); }}><PiX /></button>}
      </div>}
      {!readOnly && items.length >= 100 && <p className={css.note}>{copy.limit}</p>}
    </div>}
  </section>;
}
