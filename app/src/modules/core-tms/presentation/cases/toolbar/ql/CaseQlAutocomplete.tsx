import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { parseCaseQuery } from "../../model/query/parse";
import type { QueryMember } from "../../model/query/match";
import { insertQuerySuggestion, querySuggestions, type QuerySuggestion } from "./suggestions/query-suggestions";
import styles from "../../listing/caseListing.module.css";

type Props = { locale: TmsLocale; query: string; folders: string[]; components: string[]; tags?: string[]; members?: readonly QueryMember[]; onQuery: (value: string) => void };
export function CaseQlAutocomplete(props: Props) {
 const ru = props.locale === "ru"; const id = useId();
 const [open, setOpen] = useState(false); const [active, setActive] = useState(0); const [caret, setCaret] = useState(props.query.length);
 const root = useRef<HTMLDivElement>(null); const input = useRef<HTMLInputElement>(null);
 const result = useMemo(() => querySuggestions(props.query, caret, { ...props, ru }), [props.query, caret, props.folders, props.components, props.tags, props.members, ru]);
 const error = useMemo(() => parseCaseQuery(props.query).error, [props.query]);
 const errors: Record<string, string> = ru ? { quote: "Закройте кавычки.", field: "Неизвестное поле. Выберите поле из подсказки.", value: "Укажите значение или завершите условие.", parenthesis: "Проверьте скобки и разделители значений.", depth: "Слишком много вложенных условий.", length: "Запрос — до 4 000 символов." }
 : { quote: "Close the quotation mark.", field: "Unknown field. Choose a suggested field.", value: "Enter a value or complete the condition.", parenthesis: "Check parentheses and value separators.", depth: "Too many nested conditions.", length: "Queries support up to 4,000 characters." };
 useEffect(() => setActive(0), [props.query, caret]);
 useEffect(() => {
  const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
  document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
 }, []);
 function apply(item: QuerySuggestion) {
  const next = insertQuerySuggestion(props.query, result, item); props.onQuery(next.query); setCaret(next.caret); setOpen(item.field);
  requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(next.caret, next.caret); });
 }
 return <div ref={root} className={styles.qlRoot} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
  <label className={styles.inputShell} data-input-shell><input ref={input} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
   aria-activedescendant={open && result.suggestions[active] ? `${id}-${active}` : undefined} aria-describedby={`${id}-help`} aria-invalid={Boolean(error)}
   value={props.query} onFocus={() => setOpen(true)} onSelect={event => setCaret(event.currentTarget.selectionStart ?? props.query.length)}
   onChange={event => { props.onQuery(event.target.value); setCaret(event.target.selectionStart ?? event.target.value.length); setOpen(true); }}
   onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    if (["ArrowDown", "ArrowUp"].includes(event.key) && result.suggestions.length) { event.preventDefault(); setOpen(true); setActive(value => (value + (event.key === "ArrowDown" ? 1 : -1) + result.suggestions.length) % result.suggestions.length); }
    if (event.key === "Enter" && open && result.suggestions[active]) { event.preventDefault(); apply(result.suggestions[active]); }
   }} placeholder={ru ? "Например: статус: готов И приоритет: высокий" : "Example: status: ready AND priority: high"} aria-label={ru ? "QL-запрос" : "QL query"} />
   {props.query && <button type="button" className={styles.clearButton} onClick={() => { props.onQuery(""); setCaret(0); input.current?.focus(); }} aria-label={ru ? "Очистить QL" : "Clear QL"}><X size={12} /></button>}</label>
  <div id={`${id}-help`} className={styles.qlHelp} role="status" data-error={Boolean(error) || undefined}>{error ? errors[error] ?? (ru ? "Проверьте запрос." : "Check the query.") : ru ? 'И / ИЛИ · НЕ · несколько значений: приоритет: (высокий, критический)' : 'AND / OR · NOT · multiple values: priority: (high, critical)'}</div>
  {open && <div className={`${styles.popover} ${styles.qlSuggestions}`} id={`${id}-list`} role="listbox" aria-label={ru ? "Подсказки запроса" : "Query suggestions"}>
   {result.suggestions.map((item, index) => <button type="button" role="option" aria-selected={active === index} id={`${id}-${index}`} key={`${item.value}-${index}`}
    className={active === index ? styles.optionActive : ""} onMouseDown={event => event.preventDefault()} onClick={() => apply(item)}>
    <span>{item.label}</span><code>{item.field ? `${item.value}:` : item.detail ?? ""}</code></button>)}
   {!result.suggestions.length && <span className={styles.noOptions}>{ru ? "Введите значение; фразы заключайте в кавычки." : "Enter a value; enclose phrases in quotes."}</span>}
  </div>}
 </div>;
}
