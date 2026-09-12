import { useEffect, useId, useRef, useState } from "react";
import { PiCheck as Check, PiCaretDown as ChevronDown, PiFilePlusLight as FilePlus2, PiFunnelSimple as Filter,
  PiFolderPlusLight as FolderPlus, PiList as List, PiTreeStructure as ListTree, PiDotsThree as MoreHorizontal,
  PiMagnifyingGlass as Search, PiCheckSquareLight as SquareCheckBig, PiX as X, PiFolderSimpleLight } from "react-icons/pi";
import { FolderBreadcrumb } from "../../dialogs/folder/breadcrumb/FolderBreadcrumb";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import { dynamicGroupBy, type CaseFacetFilters, type CaseFacetOptions, type CaseGroupBy, type CaseListViewMode } from "../model/caseListModel";
import styles from "../listing/caseListing.module.css";
import repositoryStyles from "./repositoryToolbar.module.css";
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
  repositoryMode?: boolean;
  folderArchived?: boolean;
};

const groups: CaseGroupBy[] = ["none", "folder", "component", "priority", "lifecycle"];

export function CasesToolbar(props: Props) {
  const ru = props.locale === "ru";
  const [groupOpen, setGroupOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [localQl, setLocalQl] = useState("");
  const [qlExpanded, setQlExpanded] = useState(Boolean(props.qlQuery?.trim()));
  const rootRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const qlButtonRef = useRef<HTMLButtonElement>(null);
  const qlPanelRef = useRef<HTMLDivElement>(null);
  const qlPanelId = useId();
  const qlQuery = props.qlQuery ?? localQl;
  const facets = props.facetFilters ?? { folders: [], components: [] };
  const facetOptions = props.facetOptions ?? { folders: [], components: [] };
  const viewMode = props.viewMode ?? "list";
  const groupBy = props.groupBy ?? "none";
  const folderLabel = props.selectedFolder === "/" ? (ru ? "Без папки" : "Unfiled")
    : props.selectedFolder ? props.selectedFolder.split("/").filter(Boolean).join(" / ") : (ru ? "Все тест-кейсы" : "All test cases");
  const lockedTitle = ru ? "Сначала сохраните или отмените изменения в редакторе" : "Save or cancel the editor changes first";
  const createTitle = props.folderArchived ? (ru ? "Восстановите папку или выберите активную, чтобы создать кейс" : "Restore this folder or select an active folder to create a case") : props.interactionLocked ? lockedTitle : undefined;
  const activeFilterCount = Number(props.filters.type !== "all") + Number(props.filters.priority !== "all") + Number(props.filters.lifecycle !== "all")
    + Number(Boolean(props.filters.tag.trim())) + Number(props.filters.includeArchived) + facets.folders.length + facets.components.length + (facets.owners?.length ?? 0);
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
  function toggleQl() {
    setQlExpanded(!qlExpanded);
    if (!qlExpanded) requestAnimationFrame(() => qlPanelRef.current?.querySelector<HTMLInputElement>("input")?.focus());
  }
  function closeQl() { setQlExpanded(false); qlButtonRef.current?.focus(); }
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
  function guardNewCase() { return props.folderArchived || guardCreateInteraction(); }
  function closeFilters() {
    if (props.filterOpen) props.onFilterOpen();
    requestAnimationFrame(() => filterButtonRef.current?.focus());
  }

  return <div ref={rootRef} className={props.repositoryMode ? repositoryStyles.repository : undefined}>
    <div className={`${styles.controls} ${props.repositoryMode ? repositoryStyles.controls : ""}`}>
      {props.repositoryMode && <div className={repositoryStyles.context}>
        <span className={repositoryStyles.folder} title={props.selectedFolder || folderLabel}><PiFolderSimpleLight size={18} aria-hidden="true" /><FolderBreadcrumb path={props.selectedFolder} root={folderLabel} /></span>
        <span className={repositoryStyles.meta}>{props.countLabel}<i />{props.estimateLabel ?? (ru ? "Оценка не указана" : "Estimate not specified")}</span>
      </div>}
      <div className={`${styles.searchLine} ${props.repositoryMode ? repositoryStyles.searchLine : ""}`}>
        <label className={styles.inputShell} data-input-shell><Search size={14} /><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder={ru ? "Поиск по названию" : "Search by title"} aria-label={ru ? "Поиск по ID, названию, папке, компоненту или тегу" : "Search by ID, title, folder, component, or tag"} />{props.query && <button type="button" className={styles.clearButton} onClick={() => props.onQuery("")} aria-label={ru ? "Очистить" : "Clear"}><X size={12} /></button>}</label>
        <button type="button" aria-pressed={props.selectionMode}
          className={`${styles.secondaryButton} ${styles.selectionModeButton} ${props.selectionMode ? styles.selectionModeActive : ""}`}
          aria-label={ru ? "Выбрать тест-кейсы" : "Select test cases"}
          aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined}
          onClick={() => { if (!guardCreateInteraction()) props.onSelectionMode(); }}>
          <SquareCheckBig size={14} /><span className={props.repositoryMode ? repositoryStyles.selectionLabel : undefined}>{ru ? "Выбрать тест-кейсы" : "Select test cases"}</span>
        </button>
        {!props.repositoryMode && <div className={styles.segments} aria-label={ru ? "Режим списка" : "List mode"}>
          <button type="button" aria-pressed={viewMode === "list"} className={`${styles.segmentButton} ${viewMode === "list" ? styles.segmentActive : ""}`} onClick={() => chooseViewMode("list")}><List size={13} /><span>{text.list}</span></button>
          <button type="button" aria-pressed={viewMode === "dynamic"} className={`${styles.segmentButton} ${viewMode === "dynamic" ? styles.segmentActive : ""}`} onClick={() => chooseViewMode("dynamic")}><ListTree size={13} /><span>{text.dynamic}</span></button>
        </div>}
        {props.repositoryMode && <button ref={qlButtonRef} type="button" className={repositoryStyles.qlToggle}
          onClick={toggleQl} aria-expanded={qlExpanded} aria-controls={qlPanelId}
          aria-label={qlQuery.trim() ? (ru ? "QL-запрос, активен" : "QL query, active") : (ru ? "QL-запрос" : "QL query")}
          title={qlQuery.trim() || (ru ? "Расширенный поиск QL" : "Advanced QL search")}>
          QL{qlQuery.trim() && <span className={repositoryStyles.activeQuery} aria-hidden="true" />}
        </button>}
        <div className={styles.filterAnchor} data-case-popover-root>
          <button ref={filterButtonRef} type="button" className={`${styles.iconButton} ${activeFilterCount ? styles.filterActive : ""}`} onClick={() => { setActionOpen(false); setGroupOpen(false); props.onFilterOpen(); }} aria-haspopup="menu" aria-expanded={props.filterOpen} aria-controls="case-filter-panel" data-testid="case-filter-toggle" aria-label={activeFilterCount > 0 ? (ru ? `Фильтры, активно: ${activeFilterCount}` : `Filters, active: ${activeFilterCount}`) : (ru ? "Фильтры" : "Filters")}><Filter size={14} />{activeFilterCount > 0 && <b aria-hidden="true">{activeFilterCount}</b>}</button>
          {props.filterOpen && <CaseFilterMenu locale={props.locale} filters={props.filters} facets={facets} options={facetOptions} onFilters={props.onFilters} onFacets={(value) => props.onFacetFilters?.(value)} onClose={closeFilters} />}
        </div>
        <button type="button" className={styles.primaryButton} disabled={props.folderArchived} aria-disabled={props.folderArchived || props.interactionLocked || undefined} title={createTitle} onClick={() => { if (!guardNewCase()) props.onNew(props.selectedFolder); }}><FilePlus2 size={14} /><span>{ru ? "Новый кейс" : "New case"}</span></button>
        <div className={styles.actionAnchor} data-case-popover-root>
          <button type="button" className={styles.iconButton} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} onClick={() => {
            if (guardCreateInteraction()) return;
            if (props.filterOpen) props.onFilterOpen(); setGroupOpen(false); setActionOpen((value) => !value);
          }} aria-haspopup="menu" aria-expanded={actionOpen} aria-controls="case-actions-menu" aria-label={ru ? "Действия" : "Actions"}><MoreHorizontal size={15} /></button>
          {actionOpen && <div className={`${styles.popover} ${styles.actionPopover}`} id="case-actions-menu" role="menu">
            <button type="button" role="menuitem" disabled={props.folderArchived} title={createTitle} onClick={() => { if (!guardNewCase()) { setActionOpen(false); props.onNew(props.selectedFolder); } }}><FilePlus2 size={14} />{ru ? "Новый тест-кейс" : "New test case"}</button>
            {props.onNewFolder && <button type="button" role="menuitem" onClick={() => { if (!guardCreateInteraction()) { setActionOpen(false); props.onNewFolder?.(); } }}><FolderPlus size={14} />{ru ? "Новая папка" : "New folder"}</button>}
          </div>}
        </div>
      </div>
      {(!props.repositoryMode || qlExpanded) && <div ref={qlPanelRef} id={qlPanelId} className={`${styles.qlLine} ${props.repositoryMode ? repositoryStyles.qlLine : ""}`}
        onKeyDown={(event) => { if (props.repositoryMode && event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); closeQl(); } }}>
        <CaseQlAutocomplete locale={props.locale} query={qlQuery} folders={facetOptions.folders} components={facetOptions.components} onQuery={updateQl} />
        {props.repositoryMode && <button type="button" className={styles.iconButton} aria-label={ru ? "Свернуть QL-запрос" : "Collapse QL query"} onClick={closeQl}><X size={14} /></button>}
      </div>}
      {!props.repositoryMode && <div className={styles.groupLine} data-case-popover-root>
        <strong>{text.group}</strong><button type="button" className={styles.groupButton} onClick={() => { if (props.filterOpen) props.onFilterOpen(); setActionOpen(false); setGroupOpen((value) => !value); }} aria-haspopup="menu" aria-expanded={groupOpen} aria-controls="case-group-menu"><span>{groupLabels[groupBy]}</span><ChevronDown size={13} /></button>
        {groupOpen && <div className={`${styles.popover} ${styles.groupPopover}`} id="case-group-menu" role="menu">{groups.map((value) => <button type="button" role="menuitemradio" aria-checked={groupBy === value} key={value} className={groupBy === value ? styles.optionActive : ""} onClick={() => chooseGroup(value)}>{groupLabels[value]}{groupBy === value && <Check size={13} />}</button>)}</div>}
        <span className={styles.meta}>{props.countLabel}<i />{props.estimateLabel ?? (ru ? "Оценка не указана" : "Estimate not specified")}</span>
      </div>}
    </div>
  </div>;
}
