import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Box, Check, ChevronRight, CircleDot, Flag, Folder, Search, X } from "lucide-react";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import type { CaseFacetFilters, CaseFacetOptions } from "../model/caseListModel";
import styles from "../listing/caseListing.module.css";

const resetFilters: CaseFilters = { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false };
const priorities = ["all", "critical", "high", "medium", "low"] as const;
const lifecycles = ["all", "ready", "draft", "deprecated"] as const;
const caseTypes = ["all", "manual", "checklist", "automated"] as const;
type FilterSection = "folders" | "components" | "type" | "priority" | "lifecycle";

type FilterProps = {
  locale: TmsLocale; filters: CaseFilters; facets: CaseFacetFilters; options: CaseFacetOptions;
  onFilters: (value: CaseFilters) => void; onFacets: (value: CaseFacetFilters) => void; onClose: () => void;
};

export function CaseFilterMenu(props: FilterProps) {
  const ru = props.locale === "ru";
  const [section, setSection] = useState<FilterSection | null>(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const returnSectionRef = useRef<FilterSection | null>(null);
  const labels = { folders: ru ? "Папки" : "Folders", components: ru ? "Компоненты" : "Components", type: ru ? "Тип" : "Type", priority: ru ? "Приоритет" : "Priority", lifecycle: ru ? "Статус" : "Status" };
  const valueLabel = (value: string) => {
    const values: Record<string, string> = ru
      ? { all: "Все", manual: "Ручной", checklist: "Чек-лист", automated: "Автоматизированный", critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий", ready: "Готов", draft: "Черновик", deprecated: "Устарел" }
      : { all: "All", manual: "Manual", checklist: "Checklist", automated: "Automated", critical: "Critical", high: "High", medium: "Medium", low: "Low", ready: "Ready", draft: "Draft", deprecated: "Deprecated" };
    return values[value] ?? value;
  };
  const values = section === "folders" ? props.options.folders : section === "components" ? props.options.components : section === "type" ? caseTypes : section === "priority" ? priorities : lifecycles;
  const visibleValues = values.filter((value) => {
    const label = section === "components" ? localizedComponentLabel(props.locale, value) : valueLabel(value);
    return label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });

  useEffect(() => {
    const returnSelector = returnSectionRef.current ? `[data-filter-section="${returnSectionRef.current}"]` : "[role='menuitem']";
    const selector = !section ? returnSelector : section === "folders" || section === "components" ? "input" : "[role='option']";
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(selector)?.focus());
  }, [section]);

  function openSection(next: FilterSection) { returnSectionRef.current = next; setSearch(""); setSection(next); }
  function toggleMulti(field: "folders" | "components", value: string) {
    const current = props.facets[field];
    props.onFacets({ ...props.facets, [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  }
  function chooseSingle(value: string) {
    if (section === "type") props.onFilters({ ...props.filters, type: value as CaseFilters["type"] });
    if (section === "priority") props.onFilters({ ...props.filters, priority: value as CaseFilters["priority"] });
    if (section === "lifecycle") props.onFilters({ ...props.filters, lifecycle: value as CaseFilters["lifecycle"] });
    setSection(null);
  }
  function onEscape(event: React.KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault(); event.stopPropagation();
    if (section) setSection(null); else props.onClose();
  }
  function focusFacetOption(edge: "first" | "last") {
    const options = [...(optionsRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? [])];
    options[edge === "first" ? 0 : options.length - 1]?.focus();
  }
  function onFacetOptionsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const options = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='option']")];
    if (!options.length) return;
    event.preventDefault();
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0
      : event.key === "End" ? options.length - 1
        : event.key === "ArrowDown" ? (current + 1 + options.length) % options.length
          : (current - 1 + options.length) % options.length;
    options[next]?.focus();
  }
  const selectedCount = (name: "folders" | "components") => props.facets[name].length;

  return <div ref={panelRef} className={`${styles.popover} ${styles.filterPanel}`} id="case-filter-panel" data-testid="case-filters" onKeyDown={onEscape}>
    <div className={styles.filterMenuHeader}>
      {section && <button type="button" className={styles.backButton} onClick={() => setSection(null)} aria-label={ru ? "Назад к фильтрам" : "Back to filters"}><ArrowLeft size={13} /></button>}
      <strong>{section ? labels[section] : ru ? "Фильтры" : "Filters"}</strong>
      <button type="button" className={styles.closeButton} onClick={props.onClose} aria-label={ru ? "Закрыть фильтры" : "Close filters"}><X size={13} /></button>
    </div>
    {section ? <>
      {(section === "folders" || section === "components") && <label className={styles.facetSearch}><Search size={13} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "End") { event.preventDefault(); focusFacetOption(event.key === "End" ? "last" : "first"); } }} aria-controls={`case-filter-options-${section}`} placeholder={section === "folders" ? (ru ? "Поиск папок" : "Search folders") : (ru ? "Поиск компонентов" : "Search components")} /></label>}
      <div ref={optionsRef} id={`case-filter-options-${section}`} className={styles.facetOptions} role="listbox" aria-multiselectable={section === "folders" || section === "components"} aria-label={labels[section]} onKeyDown={onFacetOptionsKeyDown}>
        {visibleValues.map((value) => {
          const selected = section === "folders" ? props.facets.folders.includes(value) : section === "components" ? props.facets.components.includes(value) : section === "type" ? props.filters.type === value : section === "priority" ? props.filters.priority === value : props.filters.lifecycle === value;
          const label = section === "components" ? localizedComponentLabel(props.locale, value) : valueLabel(value);
          return <button type="button" role="option" tabIndex={-1} aria-selected={selected} key={value} className={selected ? styles.optionActive : ""} onClick={() => section === "folders" || section === "components" ? toggleMulti(section, value) : chooseSingle(value)}><span title={label}>{label}</span>{selected && <Check size={12} />}</button>;
        })}
        {visibleValues.length === 0 && <span className={styles.noOptions}>{ru ? "Ничего не найдено" : "Nothing found"}</span>}
      </div>
    </> : <div className={styles.filterMenuBody} role="menu" aria-label={ru ? "Параметры фильтра" : "Filter options"}>
      <button type="button" role="menuitem" data-filter-section="folders" aria-haspopup="listbox" onClick={() => openSection("folders")}><Folder size={13} /><span>{labels.folders}</span><small>{selectedCount("folders") || (ru ? "Все" : "All")}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="components" aria-haspopup="listbox" onClick={() => openSection("components")}><Box size={13} /><span>{labels.components}</span><small>{selectedCount("components") || (ru ? "Все" : "All")}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="type" aria-haspopup="listbox" onClick={() => openSection("type")}><Bot size={13} /><span>{labels.type}</span><small>{valueLabel(props.filters.type)}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="priority" aria-haspopup="listbox" onClick={() => openSection("priority")}><Flag size={13} /><span>{labels.priority}</span><small>{valueLabel(props.filters.priority)}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="lifecycle" aria-haspopup="listbox" onClick={() => openSection("lifecycle")}><CircleDot size={13} /><span>{labels.lifecycle}</span><small>{valueLabel(props.filters.lifecycle)}</small><ChevronRight size={13} /></button>
      <label className={styles.compactTag}><span>{ru ? "Тег" : "Tag"}</span><input value={props.filters.tag} onChange={(event) => props.onFilters({ ...props.filters, tag: event.target.value })} placeholder={ru ? "Содержит…" : "Contains…"} /></label>
      <button type="button" role="menuitemcheckbox" aria-checked={props.filters.includeArchived} onClick={() => props.onFilters({ ...props.filters, includeArchived: !props.filters.includeArchived })}><span className={styles.checkboxMark}>{props.filters.includeArchived && <Check size={11} />}</span><span>{ru ? "Показывать архивные" : "Include archived"}</span></button>
      <button type="button" className={styles.resetButton} onClick={() => { props.onFilters(resetFilters); props.onFacets({ folders: [], components: [] }); }}>{ru ? "Сбросить фильтры" : "Reset filters"}</button>
    </div>}
  </div>;
}

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
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); setOpen(true);
      setActiveIndex((current) => Math.max(0, Math.min(renderedSuggestions.length - 1, current + (event.key === "ArrowDown" ? 1 : -1))));
    }
    if (event.key === "Enter" && open && renderedSuggestions[activeIndex]) { event.preventDefault(); apply(renderedSuggestions[activeIndex].value, renderedSuggestions[activeIndex].field); }
  }
  return <div ref={rootRef} className={styles.qlRoot} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <label className={styles.inputShell}><input role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="case-ql-suggestions" aria-activedescendant={open && renderedSuggestions[activeIndex] ? `case-ql-option-${activeIndex}` : undefined} value={props.query} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} onChange={(event) => { props.onQuery(event.target.value); setOpen(true); }} placeholder={ru ? "Введите QL-запрос" : "Enter a QL query"} aria-label={ru ? "QL-запрос" : "QL query"} />{props.query && <button type="button" className={styles.clearButton} onClick={() => props.onQuery("")} aria-label={ru ? "Очистить QL" : "Clear QL"}><X size={12} /></button>}</label>
    {open && <div className={`${styles.popover} ${styles.qlSuggestions}`} id="case-ql-suggestions" role="listbox">
      <div className={styles.qlSyntax}><span><kbd>:</kbd>{ru ? "значение поля" : "field value"}</span><span><kbd>-</kbd>{ru ? "исключить" : "exclude"}</span></div>
      {renderedSuggestions.map((suggestion, index) => <button type="button" role="option" aria-selected={index === activeIndex} id={`case-ql-option-${index}`} className={index === activeIndex ? styles.optionActive : ""} key={`${suggestion.field ? "field" : "value"}-${suggestion.value}`} onMouseDown={(event) => event.preventDefault()} onClick={() => apply(suggestion.value, suggestion.field)}><span>{suggestion.label}</span><code>{suggestion.field ? `${suggestion.value}:` : suggestion.value}</code></button>)}
      {renderedSuggestions.length === 0 && <span className={styles.noOptions}>{separator >= 0 ? (ru ? "Продолжите ввод значения" : "Continue typing a value") : (ru ? "Поле не найдено" : "No matching field")}</span>}
    </div>}
  </div>;
}
