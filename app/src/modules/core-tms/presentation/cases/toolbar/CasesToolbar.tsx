import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FilePlus2, Filter, FolderPlus, List, ListTree, MoreHorizontal, Search, SquareCheckBig, X } from "lucide-react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import { dynamicGroupBy, type CaseFacetFilters, type CaseFacetOptions, type CaseGroupBy, type CaseListViewMode } from "../model/caseListModel";
import styles from "../listing/caseListing.module.css";
import { CaseFilterMenu, CaseQlAutocomplete } from "./CasesToolbarPopovers";

type Props = {
  locale: TmsLocale; query: string; countLabel: string; filters: CaseFilters; filterOpen: boolean; selectedFolder: string;
  onQuery: (value: string) => void; onFilters: (filters: CaseFilters) => void; onFilterOpen: () => void;
  onNew: (folder?: string) => void; onNewFolder?: () => void;
  qlQuery?: string; onQlQuery?: (value: string) => void; viewMode?: CaseListViewMode; onViewMode?: (value: CaseListViewMode) => void;
  groupBy?: CaseGroupBy; onGroupBy?: (value: CaseGroupBy) => void; estimateLabel?: string;
  facetFilters?: CaseFacetFilters; facetOptions?: CaseFacetOptions; onFacetFilters?: (value: CaseFacetFilters) => void;
  selectionMode: boolean; onSelectionMode: () => void;
  interactionLocked?: boolean; onLockedInteraction?: () => void;
};

const groups: CaseGroupBy[] = ["none", "folder", "component", "priority", "lifecycle"];

export function CasesToolbar(props: Props) {
  const ru = props.locale === "ru";
  const [groupOpen, setGroupOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [localQl, setLocalQl] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const qlQuery = props.qlQuery ?? localQl;
  const facets = props.facetFilters ?? { folders: [], components: [] };
  const facetOptions = props.facetOptions ?? { folders: [], components: [] };
  const viewMode = props.viewMode ?? "list";
  const groupBy = props.groupBy ?? "none";
  const lockedTitle = ru ? "Сначала сохраните или отмените изменения в редакторе" : "Save or cancel the editor changes first";
  const activeFilterCount = Number(props.filters.priority !== "all") + Number(props.filters.lifecycle !== "all")
    + Number(Boolean(props.filters.tag.trim())) + Number(props.filters.includeArchived) + facets.folders.length + facets.components.length;
  const text = {
    list: ru ? "Список" : "List", dynamic: ru ? "Группы" : "Dynamic groups", group: ru ? "Группировать:" : "Group by:",
    all: ru ? "Без группировки" : "No grouping", folder: ru ? "Папка" : "Folder", component: ru ? "Компонент" : "Component",
    priority: ru ? "Приоритет" : "Priority", lifecycle: ru ? "Статус" : "Status",
  };
  const groupLabels: Record<CaseGroupBy, string> = { none: text.all, folder: text.folder, component: text.component, priority: text.priority, lifecycle: text.lifecycle };

  useEffect(() => {
    function close(event: PointerEvent) { if (!rootRef.current?.contains(event.target as Node)) { setGroupOpen(false); setActionOpen(false); } }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setGroupOpen(false); setActionOpen(false); } }
    window.addEventListener("pointerdown", close); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => { if (props.interactionLocked) setActionOpen(false); }, [props.interactionLocked]);

  function updateQl(value: string) { props.onQlQuery ? props.onQlQuery(value) : setLocalQl(value); }
  function chooseViewMode(value: CaseListViewMode) {
    if (value === "dynamic") props.onGroupBy?.(dynamicGroupBy(groupBy));
    props.onViewMode?.(value);
  }
  function chooseGroup(value: CaseGroupBy) {
    props.onGroupBy?.(value); if (value !== "none") props.onViewMode?.("dynamic"); setGroupOpen(false);
  }
  function guardCreateInteraction() {
    if (!props.interactionLocked) return false;
    setActionOpen(false); props.onLockedInteraction?.(); return true;
  }
  function closeFilters() {
    if (props.filterOpen) props.onFilterOpen();
    requestAnimationFrame(() => filterButtonRef.current?.focus());
  }

  return <div ref={rootRef}>
    <div className={styles.controls}>
      <div className={styles.searchLine}>
        <label className={styles.inputShell}><Search size={14} /><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder={ru ? "Поиск по названию" : "Search by title"} aria-label={ru ? "Поиск по ID, названию, папке, компоненту или тегу" : "Search by ID, title, folder, component, or tag"} />{props.query && <button type="button" className={styles.clearButton} onClick={() => props.onQuery("")} aria-label={ru ? "Очистить" : "Clear"}><X size={12} /></button>}</label>
        <button type="button" aria-pressed={props.selectionMode}
          className={`${styles.secondaryButton} ${styles.selectionModeButton} ${props.selectionMode ? styles.selectionModeActive : ""}`}
          aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined}
          onClick={() => { if (!guardCreateInteraction()) props.onSelectionMode(); }}>
          <SquareCheckBig size={14} /><span>{ru ? "Выбрать тест-кейсы" : "Select test cases"}</span>
        </button>
        <div className={styles.segments} aria-label={ru ? "Режим списка" : "List mode"}>
          <button type="button" aria-pressed={viewMode === "list"} className={`${styles.segmentButton} ${viewMode === "list" ? styles.segmentActive : ""}`} onClick={() => chooseViewMode("list")}><List size={13} /><span>{text.list}</span></button>
          <button type="button" aria-pressed={viewMode === "dynamic"} className={`${styles.segmentButton} ${viewMode === "dynamic" ? styles.segmentActive : ""}`} onClick={() => chooseViewMode("dynamic")}><ListTree size={13} /><span>{text.dynamic}</span></button>
        </div>
        <div className={styles.filterAnchor} data-case-popover-root>
          <button ref={filterButtonRef} type="button" className={`${styles.iconButton} ${activeFilterCount ? styles.filterActive : ""}`} onClick={() => { setActionOpen(false); setGroupOpen(false); props.onFilterOpen(); }} aria-haspopup="menu" aria-expanded={props.filterOpen} aria-controls="case-filter-panel" data-testid="case-filter-toggle" aria-label={ru ? "Фильтры" : "Filters"}><Filter size={14} />{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
          {props.filterOpen && <CaseFilterMenu locale={props.locale} filters={props.filters} facets={facets} options={facetOptions} onFilters={props.onFilters} onFacets={(value) => props.onFacetFilters?.(value)} onClose={closeFilters} />}
        </div>
        <button type="button" className={styles.primaryButton} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} onClick={() => { if (!guardCreateInteraction()) props.onNew(props.selectedFolder); }}><FilePlus2 size={14} /><span>{ru ? "Новый кейс" : "New case"}</span></button>
        <div className={styles.actionAnchor} data-case-popover-root>
          <button type="button" className={styles.iconButton} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} onClick={() => {
            if (guardCreateInteraction()) return;
            if (props.filterOpen) props.onFilterOpen(); setGroupOpen(false); setActionOpen((value) => !value);
          }} aria-haspopup="menu" aria-expanded={actionOpen} aria-controls="case-actions-menu" aria-label={ru ? "Действия" : "Actions"}><MoreHorizontal size={15} /></button>
          {actionOpen && <div className={`${styles.popover} ${styles.actionPopover}`} id="case-actions-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { if (!guardCreateInteraction()) { setActionOpen(false); props.onNew(props.selectedFolder); } }}><FilePlus2 size={14} />{ru ? "Новый тест-кейс" : "New test case"}</button>
            {props.onNewFolder && <button type="button" role="menuitem" onClick={() => { if (!guardCreateInteraction()) { setActionOpen(false); props.onNewFolder?.(); } }}><FolderPlus size={14} />{ru ? "Новая папка" : "New folder"}</button>}
          </div>}
        </div>
      </div>
      <div className={styles.qlLine}><CaseQlAutocomplete locale={props.locale} query={qlQuery} folders={facetOptions.folders} components={facetOptions.components} onQuery={updateQl} /></div>
      <div className={styles.groupLine} data-case-popover-root>
        <strong>{text.group}</strong><button type="button" className={styles.groupButton} onClick={() => { if (props.filterOpen) props.onFilterOpen(); setActionOpen(false); setGroupOpen((value) => !value); }} aria-haspopup="menu" aria-expanded={groupOpen} aria-controls="case-group-menu"><span>{groupLabels[groupBy]}</span><ChevronDown size={13} /></button>
        {groupOpen && <div className={`${styles.popover} ${styles.groupPopover}`} id="case-group-menu" role="menu">{groups.map((value) => <button type="button" role="menuitemradio" aria-checked={groupBy === value} key={value} className={groupBy === value ? styles.optionActive : ""} onClick={() => chooseGroup(value)}>{groupLabels[value]}{groupBy === value && <Check size={13} />}</button>)}</div>}
        <span className={styles.meta}>{props.countLabel}<i />{props.estimateLabel ?? (ru ? "Оценка не указана" : "Estimate not specified")}</span>
      </div>
    </div>
  </div>;
}
