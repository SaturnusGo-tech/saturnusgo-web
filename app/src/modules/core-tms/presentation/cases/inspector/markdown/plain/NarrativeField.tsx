"use client";
import { Check, Pencil } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { MarkdownField } from "../MarkdownField";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import css from "./plainMarkdown.module.css";

export function NarrativeField({ label, value, onChange, disabled = false, framed = false, error }: {
  label: string; value: string; onChange?: (value: string) => void; disabled?: boolean; framed?: boolean; error?: string;
}) {
  const [editing, setEditing] = useState(false);
  const errorId = useId();
  useEffect(() => { if (error) setEditing(true); }, [error]);
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <section className={css.section} aria-label={label}>
    <header><h3>{label}</h3>{onChange && <button type="button" className={css.edit} disabled={disabled}
      aria-label={`${editing ? (ru ? "Готово" : "Done") : (ru ? "Изменить" : "Edit")}: ${label}`}
      onClick={() => setEditing(!editing)}>{editing ? <Check size={14} /> : <Pencil size={14} />}</button>}</header>
    <div className={framed ? css.frame : undefined} data-editing={editing} data-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
    <MarkdownField appearance="plain" label={label} value={value} allowAttachments={false}
      emptyLabel={onChange ? (ru ? "Добавить текст…" : "Add text…") : (ru ? "Не указано" : "Not provided")}
      autoFocus={editing} onChange={editing && !disabled ? onChange : undefined}
      onRequestEdit={onChange && !disabled ? () => setEditing(true) : undefined} />
    </div>
    {error && <small id={errorId} className={css.error} role="alert">{error}</small>}
  </section>;
}
