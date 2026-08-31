import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FilePlus2, Filter, FolderPlus, List, ListTree, MoreHorizontal, Search, X } from "lucide-react";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import { dynamicGroupBy, type CaseFacetFilters, type CaseFacetOptions, type CaseGroupBy, type CaseListViewMode } from "../model/caseListModel";
import styles from "../listing/caseListing.module.css";

type Props = {
  locale: TmsLocale; query: string; countLabel: string; filters: CaseFilters; filterOpen: boolean; selectedFolder: string;
  onQuery: (value: string) => void; onFilters: (filters: CaseFilters) => void; onFilterOpen: () => void;
  onNew: (folder?: string) => void; onNewFolder?: () => void;
  qlQuery?: string; onQlQuery?: (value: string) => void; viewMode?: CaseListViewMode; onViewMode?: (value: CaseListViewMode) => void;
  groupBy?: CaseGroupBy; onGroupBy?: (value: CaseGroupBy) => void; estimateLabel?: string;
  facetFilters?: CaseFacetFilters; facetOptions?: CaseFacetOptions; onFacetFilters?: (value: CaseFacetFilters) => void;
  interactionLocked?: boolean; onLockedInteraction?: () => void;
};

const defaultFilters: CaseFilters = { priority: "all", lifecycle: "all", tag: "", includeArchived: false };
const priorities = ["all", "critical", "high", "medium", "low"] as const;
const lifecycles = ["all", "ready", "draft", "deprecated"] as const;
const groups: CaseGroupBy[] = ["none", "folder", "component", "priority", "lifecycle"];

export function CasesToolbar(props: Props) {
  const ru = props.locale === "ru";
  const [groupOpen, setGroupOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [localQl, setLocalQl] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const qlQuery = props.qlQuery ?? localQl;
  const facets = props.facetFilters ?? { folders: [], components: [] };
  const viewMode = props.viewMode ?? "list";
  const groupBy = props.groupBy ?? "none";
  const lockedTitle = ru
    ? "Сначала сохраните или отмените изменения в редакторе"
    : "Save or cancel the editor changes first";
  const activeFilterCount = Number(props.filters.priority !== "all") + Number(props.filters.lifecycle !== "all")
    + Number(Boolean(props.filters.tag.trim())) + Number(props.filters.includeArchived) + facets.folders.length + facets.components.length;
  const text = {
    list: ru ? "Список" : "List", dynamic: ru ? "Группы" : "Dynamic groups", group: ru ? "Группировать:" : "Group by:",
    ql: ru ? "Введите QL-запрос" : "Enter a QL query", all: ru ? "Все" : "All", folder: ru ? "Папка" : "Folder",
    component: ru ? "Компонент" : "Component", priority: ru ? "Приоритет" : "Priority", lifecycle: ru ? "Статус" : "Status",
  };

  useEffect(() => {
    function close(event: PointerEvent) { if (!rootRef.current?.contains(event.target as Node)) { setGroupOpen(false); setActionOpen(false); } }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setGroupOpen(false); setActionOpen(false); } }
    window.addEventListener("pointerdown", close); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", escape); };
  }, []);

  useEffect(() => {
    if (props.interactionLocked) setActionOpen(false);
  }, [props.interactionLocked]);

  function guardCreateInteraction() {
    if (!props.interactionLocked) return false;
    setActionOpen(false);
    props.onLockedInteraction?.();
    return true;
  }

  function updateQl(value: string) { props.onQlQuery ? props.onQlQuery(value) : setLocalQl(value); }
  function chooseViewMode(value: CaseListViewMode) {
    if (value === "dynamic") props.onGroupBy?.(dynamicGroupBy(groupBy));
    props.onViewMode?.(value);
  }
  function chooseGroup(value: CaseGroupBy) {
    props.onGroupBy?.(value); if (value !== "none") props.onViewMode?.("dynamic"); setGroupOpen(false);
  }
  function filterLabel(value: string) {
    const labels: Record<string, string> = ru
      ? { all: "Все", critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий", ready: "Готов", draft: "Черновик", deprecated: "Устарел" }
      : { all: "All", critical: "Critical", high: "High", medium: "Medium", low: "Low", ready: "Ready", draft: "Draft", deprecated: "Deprecated" };
    return labels[value] ?? value;
  }
  function toggleFacet(field: keyof CaseFacetFilters, value: string) {
    const selected = facets[field];
    props.onFacetFilters?.({ ...facets, [field]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] });
  }
  const groupLabels: Record<CaseGroupBy, string> = { none: text.all, folder: text.folder, component: text.component, priority: text.priority, lifecycle: text.lifecycle };

  return <div ref={rootRef}>
    <div className={styles.controls}>
      <div className={styles.searchLine}>
        <label className={styles.inputShell}><Search size={14} /><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder={ru ? "Поиск по кейсам" : "Search test cases"} aria-label={ru ? "Поиск по ID, названию, папке, компоненту или тегу" : "Search by ID, title, folder, component, or tag"} />{props.query && <button className={styles.clearButton} onClick={() => props.onQuery("")} aria-label={ru ? "Очистить" : "Clear"}><X size={12} /></button>}</label>
        <div className={styles.segments} aria-label={ru ? "Режим списка" : "List mode"}>
          <button className={`${styles.segmentButton} ${viewMode === "list" ? styles.segmentActive : ""}`} onClick={() => chooseViewMode("list")}><List size={13} /><span>{text.list}</span></button>
          <button className={`${styles.segmentButton} ${viewMode === "dynamic" ? styles.segmentActive : ""}`} onClick={() => chooseViewMode("dynamic")}><ListTree size={13} /><span>{text.dynamic}</span></button>
        </div>
        <div className={styles.filterAnchor} data-case-popover-root>
          <button className={`${styles.iconButton} ${activeFilterCount ? styles.filterActive : ""}`} onClick={() => { setActionOpen(false); setGroupOpen(false); props.onFilterOpen(); }} aria-expanded={props.filterOpen} aria-controls="case-filter-panel" data-testid="case-filter-toggle" aria-label={ru ? "Фильтры" : "Filters"}><Filter size={14} />{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
          {props.filterOpen && <div className={`${styles.popover} ${styles.filterPanel}`} id="case-filter-panel" data-testid="case-filters">
            <div className={styles.filterHeader}><strong>{ru ? "Фильтры" : "Filters"}</strong><button onClick={() => { props.onFilters(defaultFilters); props.onFacetFilters?.({ folders: [], components: [] }); }}>{ru ? "Сбросить" : "Reset"}</button></div>
            {props.facetOptions && <><div className={styles.filterField}><span>{ru ? "Папки" : "Folders"}</span><div className={styles.facetList}>{props.facetOptions.folders.map((value) => <button key={value} className={`${styles.facetOption} ${facets.folders.includes(value) ? styles.optionActive : ""}`} onClick={() => toggleFacet("folders", value)}><span title={value}>{value}</span>{facets.folders.includes(value) && <Check size={12} />}</button>)}</div></div>
            <div className={styles.filterField}><span>{ru ? "Компоненты" : "Components"}</span><div className={styles.facetList}>{props.facetOptions.components.map((value) => <button key={value} className={`${styles.facetOption} ${facets.components.includes(value) ? styles.optionActive : ""}`} onClick={() => toggleFacet("components", value)}><span title={localizedComponentLabel(props.locale, value)}>{localizedComponentLabel(props.locale, value)}</span>{facets.components.includes(value) && <Check size={12} />}</button>)}</div></div></>}
            <div className={styles.filterField}><span>{text.priority}</span><div className={styles.choices}>{priorities.map((value) => <button key={value} className={`${styles.choiceButton} ${props.filters.priority === value ? styles.choiceActive : ""}`} onClick={() => props.onFilters({ ...props.filters, priority: value })}>{filterLabel(value)}</button>)}</div></div>
            <div className={styles.filterField}><span>{text.lifecycle}</span><div className={styles.choices}>{lifecycles.map((value) => <button key={value} className={`${styles.choiceButton} ${props.filters.lifecycle === value ? styles.choiceActive : ""}`} onClick={() => props.onFilters({ ...props.filters, lifecycle: value })}>{filterLabel(value)}</button>)}</div></div>
            <label className={styles.filterField}><span>{ru ? "Тег содержит" : "Tag contains"}</span><input type="text" value={props.filters.tag} onChange={(event) => props.onFilters({ ...props.filters, tag: event.target.value })} placeholder="smoke" /></label>
            <label className={styles.checkField}><input type="checkbox" checked={props.filters.includeArchived} onChange={(event) => props.onFilters({ ...props.filters, includeArchived: event.target.checked })} />{ru ? "Показывать архивные" : "Include archived"}</label>
          </div>}
        </div>
        <button className={styles.primaryButton} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} onClick={() => {
          if (!guardCreateInteraction()) props.onNew(props.selectedFolder);
        }}><FilePlus2 size={14} /><span>{ru ? "Новый кейс" : "New case"}</span></button>
        <div className={styles.actionAnchor} data-case-popover-root>
          <button className={styles.iconButton} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} onClick={() => {
            if (guardCreateInteraction()) return;
            if (props.filterOpen) props.onFilterOpen();
            setGroupOpen(false);
            setActionOpen((value) => !value);
          }} aria-expanded={actionOpen} aria-label={ru ? "Действия" : "Actions"}><MoreHorizontal size={15} /></button>
          {actionOpen && <div className={`${styles.popover} ${styles.actionPopover}`}>
            <button onClick={() => { if (!guardCreateInteraction()) { setActionOpen(false); props.onNew(props.selectedFolder); } }}><FilePlus2 size={14} />{ru ? "Новый тест-кейс" : "New test case"}</button>
            {props.onNewFolder && <button onClick={() => { if (!guardCreateInteraction()) { setActionOpen(false); props.onNewFolder?.(); } }}><FolderPlus size={14} />{ru ? "Новая папка" : "New folder"}</button>}
          </div>}
        </div>
      </div>
      <div className={styles.qlLine}><label className={styles.inputShell}><input value={qlQuery} onChange={(event) => updateQl(event.target.value)} placeholder={text.ql} aria-label={text.ql} />{qlQuery && <button className={styles.clearButton} onClick={() => updateQl("")} aria-label={ru ? "Очистить QL" : "Clear QL"}><X size={12} /></button>}</label></div>
      <div className={styles.groupLine} data-case-popover-root>
        <strong>{text.group}</strong><button className={styles.groupButton} onClick={() => { if (props.filterOpen) props.onFilterOpen(); setActionOpen(false); setGroupOpen((value) => !value); }} aria-expanded={groupOpen}><span>{groupLabels[groupBy]}</span><ChevronDown size={13} /></button>
        {groupOpen && <div className={`${styles.popover} ${styles.groupPopover}`}>{groups.map((value) => <button key={value} className={groupBy === value ? styles.optionActive : ""} onClick={() => chooseGroup(value)}>{groupLabels[value]}{groupBy === value && <Check size={13} />}</button>)}</div>}
        <span className={styles.meta}>{props.countLabel}<i />{props.estimateLabel ?? (ru ? "Оценка не указана" : "Estimate not specified")}</span>
      </div>
    </div>
  </div>;
}
