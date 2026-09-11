import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Bot, Box, Check, ChevronRight, CircleDot, Flag, Folder, Search, X } from "lucide-react";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import type { CaseFacetFilters, CaseFacetOptions } from "../model/caseListModel";
import styles from "../listing/caseListing.module.css";

import { FilterTransition } from "./filter/FilterTransition";

export type ExtraFilterSection = { id: string; label: string; icon: ReactNode; summary: string; active: boolean; render: () => ReactNode };

const resetFilters: CaseFilters = { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false };
const priorities = ["all", "critical", "high", "medium", "low"] as const;
const lifecycles = ["all", "ready", "draft", "deprecated"] as const;
const caseTypes = ["all", "manual", "checklist", "automated"] as const;

type FilterProps = {
  customSectionsOnly?: boolean; extraSections?: ExtraFilterSection[]; onResetExtra?: () => void;
  locale: TmsLocale; filters: CaseFilters; facets: CaseFacetFilters; options: CaseFacetOptions;
  onFilters: (value: CaseFilters) => void; onFacets: (value: CaseFacetFilters) => void; onClose: () => void;
};

export function CaseFilterMenu(props: FilterProps) {
  const ru = props.locale === "ru";
  const [section, setSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const returnSectionRef = useRef<string | null>(null);
  const extra = props.extraSections?.find((item) => item.id === section);
  const labels: Record<string, string> = { folders: ru ? "Папки" : "Folders", components: ru ? "Компоненты" : "Components", type: ru ? "Тип" : "Type", priority: ru ? "Приоритет" : "Priority", lifecycle: ru ? "Статус" : "Status" };
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
    const selector = !section ? returnSelector : section === "folders" || section === "components" || extra ? "input, [role='option']" : "[role='option']";
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(`[data-filter-view="${section ?? "root"}"] ${selector}`)?.focus());
  }, [section]);

  useEffect(()=>{const close=(event:PointerEvent)=>{
    const target=event.target as Node;
    if(!panelRef.current?.contains(target)&&!panelRef.current?.parentElement?.querySelector("button")?.contains(target))props.onClose();
  };document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[props.onClose]);
  function openSection(next: string) { returnSectionRef.current = next; setSearch(""); setSection(next); }
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
    props.onClose();
    panelRef.current?.parentElement?.querySelector<HTMLButtonElement>("button")?.focus();
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
      <strong>{section ? extra?.label ?? labels[section] : ru ? "Фильтры" : "Filters"}</strong>
      <button type="button" className={styles.closeButton} onClick={props.onClose} aria-label={ru ? "Закрыть фильтры" : "Close filters"}><X size={13} /></button>
    </div>
    <FilterTransition view={section ?? "root"}>
    {extra ? extra.render() : section ? <>
      {(section === "folders" || section === "components") && <label className={styles.facetSearch} data-input-shell><Search size={13} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "End") { event.preventDefault(); focusFacetOption(event.key === "End" ? "last" : "first"); } }} aria-controls={`case-filter-options-${section}`} placeholder={section === "folders" ? (ru ? "Поиск папок" : "Search folders") : (ru ? "Поиск компонентов" : "Search components")} /></label>}
      <div ref={optionsRef} id={`case-filter-options-${section}`} className={styles.facetOptions} role="listbox" aria-multiselectable={section === "folders" || section === "components"} aria-label={labels[section]} onKeyDown={onFacetOptionsKeyDown}>
        {visibleValues.map((value) => {
          const selected = section === "folders" ? props.facets.folders.includes(value) : section === "components" ? props.facets.components.includes(value) : section === "type" ? props.filters.type === value : section === "priority" ? props.filters.priority === value : props.filters.lifecycle === value;
          const label = section === "components" ? localizedComponentLabel(props.locale, value) : valueLabel(value);
          return <button type="button" role="option" tabIndex={-1} aria-selected={selected} key={value} className={selected ? styles.optionActive : ""} onClick={() => section === "folders" || section === "components" ? toggleMulti(section, value) : chooseSingle(value)}><span title={label}>{label}</span>{selected && <Check size={12} />}</button>;
        })}
        {visibleValues.length === 0 && <span className={styles.noOptions}>{ru ? "Ничего не найдено" : "Nothing found"}</span>}
      </div>
    </> : <div className={styles.filterMenuBody} role="menu" aria-label={ru ? "Параметры фильтра" : "Filter options"}>
      {props.extraSections?.map((item) => <button type="button" role="menuitem" key={item.id} data-filter-section={item.id} aria-haspopup="listbox" onClick={() => openSection(item.id)}>{item.icon}<span>{item.label}</span><small data-active={item.active || undefined}>{item.summary}</small><ChevronRight size={13} /></button>)}
      {!props.customSectionsOnly && <><button type="button" role="menuitem" data-filter-section="folders" aria-haspopup="listbox" onClick={() => openSection("folders")}><Folder size={13} /><span>{labels.folders}</span><small>{selectedCount("folders") || (ru ? "Все" : "All")}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="components" aria-haspopup="listbox" onClick={() => openSection("components")}><Box size={13} /><span>{labels.components}</span><small>{selectedCount("components") || (ru ? "Все" : "All")}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="type" aria-haspopup="listbox" onClick={() => openSection("type")}><Bot size={13} /><span>{labels.type}</span><small>{valueLabel(props.filters.type)}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="priority" aria-haspopup="listbox" onClick={() => openSection("priority")}><Flag size={13} /><span>{labels.priority}</span><small>{valueLabel(props.filters.priority)}</small><ChevronRight size={13} /></button>
      <button type="button" role="menuitem" data-filter-section="lifecycle" aria-haspopup="listbox" onClick={() => openSection("lifecycle")}><CircleDot size={13} /><span>{labels.lifecycle}</span><small>{valueLabel(props.filters.lifecycle)}</small><ChevronRight size={13} /></button>
      <label className={styles.compactTag}><span>{ru ? "Тег" : "Tag"}</span><input value={props.filters.tag} onChange={(event) => props.onFilters({ ...props.filters, tag: event.target.value })} placeholder={ru ? "Содержит…" : "Contains…"} /></label></>}
      <button type="button" role="menuitemcheckbox" aria-checked={props.filters.includeArchived} onClick={() => props.onFilters({ ...props.filters, includeArchived: !props.filters.includeArchived })}><span className={styles.checkboxMark}>{props.filters.includeArchived && <Check size={11} />}</span><span>{ru ? "Показывать архивные" : "Include archived"}</span></button>
      <button type="button" className={styles.resetButton} onClick={() => { props.onFilters(resetFilters); props.onFacets({ folders: [], components: [] }); props.onResetExtra?.(); }}>{ru ? "Сбросить фильтры" : "Reset filters"}</button>
    </div>}
    </FilterTransition>
  </div>;
}

export { CaseQlAutocomplete } from "./ql/CaseQlAutocomplete";
