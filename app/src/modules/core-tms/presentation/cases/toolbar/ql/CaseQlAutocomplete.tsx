import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { localizedComponentLabel } from "../../../../localization/format/labels";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "../../listing/caseListing.module.css";

type QlField = { key: string; ru: string; en: string; values?: readonly string[] };
const qlFields: QlField[] = [
  { key: "key", ru: "ID", en: "ID" }, { key: "title", ru: "Название", en: "Title" },
  { key: "lifecycle", ru: "Статус", en: "Status", values: ["ready", "draft", "deprecated", "archived"] },
  { key: "priority", ru: "Приоритет", en: "Priority", values: ["critical", "high", "medium", "low"] },
  { key: "component", ru: "Компонент", en: "Component" }, { key: "folder", ru: "Папка", en: "Folder" },
  { key: "tag", ru: "Тег", en: "Tag" }, { key: "type", ru: "Тип", en: "Type", values: ["manual", "checklist", "automated"] },
  { key: "owner", ru: "Ответственный", en: "Owner" },
];
const qlFieldAliases: Record<string, string> = {
  id: "key", key: "key", ид: "key", title: "title", name: "title", название: "title",
  status: "lifecycle", state: "lifecycle", lifecycle: "lifecycle", статус: "lifecycle", состояние: "lifecycle",
  priority: "priority", приоритет: "priority", component: "component", functionality: "component", компонент: "component",
  folder: "folder", path: "folder", папка: "folder", tag: "tag", тег: "tag", type: "type", тип: "type",
  owner: "owner", assignee: "owner", владелец: "owner", ответственный: "owner",
};

function tokenStart(query: string) {
  let quoted = false;
  for (let index = query.length - 1; index >= 0; index -= 1) {
    if (query[index] === '"') quoted = !quoted;
    if (!quoted && /\s/.test(query[index])) return index + 1;
  }
  return 0;
}

type QlProps = { locale: TmsLocale; query: string; folders: string[]; components: string[]; onQuery: (value: string) => void };
export function CaseQlAutocomplete(props: QlProps) {
  const ru = props.locale === "ru";
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const start = tokenStart(props.query);
  const token = props.query.slice(start);
  const excluded = token.startsWith("-");
  const body = excluded ? token.slice(1) : token;
  const separator = body.indexOf(":");
  const fieldKey = separator >= 0 ? body.slice(0, separator).toLocaleLowerCase() : "";
  const valueQuery = separator >= 0 ? body.slice(separator + 1).replace(/^"|"$/g, "") : "";
  const suggestions = useMemo(() => {
    if (separator < 0) return qlFields.filter((field) => `${field.key} ${ru ? field.ru : field.en}`.toLocaleLowerCase().includes(body.toLocaleLowerCase())).map((field) => ({ value: field.key, label: ru ? field.ru : field.en, field: true }));
    const canonicalField = qlFieldAliases[fieldKey] ?? fieldKey;
    const field = qlFields.find((item) => item.key === canonicalField);
    const dynamic = canonicalField === "folder" ? props.folders : canonicalField === "component" ? props.components : field?.values ?? [];
    return dynamic.filter((value) => value.toLocaleLowerCase().includes(valueQuery.toLocaleLowerCase())).map((value) => ({ value, label: canonicalField === "component" ? localizedComponentLabel(props.locale, value) : value, field: false }));
  }, [body, fieldKey, props.components, props.folders, props.locale, ru, separator, valueQuery]);
  const renderedSuggestions = suggestions.slice(0, 10);
  useEffect(() => { setActiveIndex(0); }, [token]);
  useEffect(() => {
    setActiveIndex((current) => Math.max(0, Math.min(renderedSuggestions.length - 1, current)));
  }, [renderedSuggestions.length]);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("pointerdown", close); return () => window.removeEventListener("pointerdown", close);
  }, []);
  function apply(value: string, isField: boolean) {
    const prefix = excluded ? "-" : "";
    const replacement = isField ? `${prefix}${value}:` : `${prefix}${fieldKey}:${/\s/.test(value) ? `"${value}"` : value} `;
    props.onQuery(`${props.query.slice(0, start)}${replacement}`); setOpen(true);
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); setOpen(true);
      setActiveIndex((current) => Math.max(0, Math.min(renderedSuggestions.length - 1, current + (event.key === "ArrowDown" ? 1 : -1))));
    }
    if (event.key === "Enter" && open && renderedSuggestions[activeIndex]) { event.preventDefault(); apply(renderedSuggestions[activeIndex].value, renderedSuggestions[activeIndex].field); }
  }
  return <div ref={rootRef} className={styles.qlRoot} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <label className={styles.inputShell} data-input-shell><input role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="case-ql-suggestions" aria-activedescendant={open && renderedSuggestions[activeIndex] ? `case-ql-option-${activeIndex}` : undefined} value={props.query} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} onChange={(event) => { props.onQuery(event.target.value); setOpen(true); }} placeholder={ru ? "Введите QL-запрос" : "Enter a QL query"} aria-label={ru ? "QL-запрос" : "QL query"} />{props.query && <button type="button" className={styles.clearButton} onClick={() => props.onQuery("")} aria-label={ru ? "Очистить QL" : "Clear QL"}><X size={12} /></button>}</label>
    {open && <div className={`${styles.popover} ${styles.qlSuggestions}`} id="case-ql-suggestions" role="listbox">
      <div className={styles.qlSyntax}><span><kbd>:</kbd>{ru ? "значение поля" : "field value"}</span><span><kbd>-</kbd>{ru ? "исключить" : "exclude"}</span></div>
      {renderedSuggestions.map((suggestion, index) => <button type="button" role="option" aria-selected={index === activeIndex} id={`case-ql-option-${index}`} className={index === activeIndex ? styles.optionActive : ""} key={`${suggestion.field ? "field" : "value"}-${suggestion.value}`} onMouseDown={(event) => event.preventDefault()} onClick={() => apply(suggestion.value, suggestion.field)}><span>{suggestion.label}</span><code>{suggestion.field ? `${suggestion.value}:` : suggestion.value}</code></button>)}
      {renderedSuggestions.length === 0 && <span className={styles.noOptions}>{separator >= 0 ? (ru ? "Продолжите ввод значения" : "Continue typing a value") : (ru ? "Поле не найдено" : "No matching field")}</span>}
    </div>}
  </div>;
}
