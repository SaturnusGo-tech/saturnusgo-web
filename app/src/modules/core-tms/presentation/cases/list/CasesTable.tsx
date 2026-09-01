import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Hand, ListChecks, Search } from "lucide-react";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import { groupCaseRows, visibleCaseTabStop, type CaseGroupBy, type CaseListViewMode } from "../model/caseListModel";
import type { CaseListRow, CaseSort, CaseSortKey } from "../types";
import { LifecycleBadge, PriorityBadge } from "./CaseBadges";
import { CaseSelectionCheckbox } from "../bulk/checkbox/CaseSelectionCheckbox";
import { CaseSelectionHeader } from "../bulk/checkbox/CaseSelectionHeader";
import { selectionCoverage, type SelectionCoverage } from "../bulk/selection/caseSelection";
import styles from "../listing/caseListing.module.css";

type Props = {
  locale: TmsLocale;
  rows: CaseListRow[];
  selectedCaseId: string;
  sort: CaseSort;
  onSort: (key: CaseSortKey) => void;
  onSelect: (row: CaseListRow) => void;
  onCreate: () => void;
  viewMode?: CaseListViewMode;
  groupBy?: CaseGroupBy;
  interactionLocked?: boolean;
  onLockedInteraction?: () => void;
  selectedIds: ReadonlySet<string>;
  selectableIds: ReadonlySet<string>;
  selectedCount: number;
  selectableCount: number;
  visibleCoverage: SelectionCoverage;
  selectionMode: boolean;
  onToggleCase: (id: string) => void;
  onToggleScope: (ids: readonly string[]) => void;
  onSelectVisible: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

const columns: Array<{ key?: CaseSortKey; ru: string; en: string; className: keyof typeof styles }> = [
  { ru: "", en: "", className: "selectionColumn" },
  { ru: "", en: "", className: "flagColumn" },
  { ru: "", en: "", className: "typeColumn" },
  { key: "key", ru: "ID", en: "ID", className: "keyColumn" },
  { key: "lifecycle", ru: "Статус", en: "Status", className: "statusColumn" },
  { key: "title", ru: "Тест-кейс", en: "Test case", className: "titleColumn" },
  { key: "component", ru: "Функциональность", en: "Functionality", className: "functionColumn" },
  { key: "priority", ru: "Приоритет", en: "Priority", className: "priorityColumn" },
  { key: "estimate", ru: "Оценка", en: "Estimate", className: "estimateColumn" },
];

function groupLabel(locale: TmsLocale, groupBy: CaseGroupBy, value: string) {
  if (groupBy === "lifecycle" || groupBy === "priority") return localizedLabel(locale, value);
  if (groupBy === "component") return localizedComponentLabel(locale, value) || "—";
  return value || "—";
}

export function CasesTable(props: Props) {
  const ru = props.locale === "ru";
  const effectiveGroup = props.viewMode === "dynamic" ? (props.groupBy ?? "none") : "none";
  const groups = useMemo(() => groupCaseRows(props.rows, effectiveGroup), [effectiveGroup, props.rows]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const rowById = useMemo(() => new Map(props.rows.map((row) => [row.testCase.id, row])), [props.rows]);
  const tabStopId = visibleCaseTabStop(groups, collapsed, props.selectedCaseId);
  const lockedTitle = ru
    ? "Сначала сохраните или отмените изменения в редакторе"
    : "Save or cancel the editor changes first";

  function moveFocus(event: React.KeyboardEvent<HTMLTableRowElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const available = [...(event.currentTarget.closest("tbody")?.querySelectorAll<HTMLTableRowElement>("tr[data-case-row]") ?? [])];
    const currentIndex = available.indexOf(event.currentTarget);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1
      : Math.max(0, Math.min(available.length - 1, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
    const target = available[nextIndex];
    target?.focus();
    const row = target ? rowById.get(target.dataset.caseId ?? "") : undefined;
    if (row) props.onSelect(row);
  }

  if (props.rows.length === 0) return <div className={styles.empty}>
    <Search size={20} />
    <strong>{ru ? "Тест-кейсы не найдены" : "No test cases found"}</strong>
    <span>{ru ? "Измените поиск, QL-запрос или фильтры." : "Adjust search, QL query, or filters."}</span>
    <button className={styles.secondaryButton} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} onClick={() => {
      if (props.interactionLocked) props.onLockedInteraction?.();
      else props.onCreate();
    }}><ListChecks size={14} />{ru ? "Создать кейс" : "Create case"}</button>
  </div>;

  return <div className={`${styles.tableScroll} ${props.selectedCount > 0 ? styles.tableScrollBulkActive : ""}`}>
    <table className={`${styles.table} ${props.selectionMode ? styles.selectionMode : ""}`}>
      <colgroup>{columns.map((column, index) => <col className={styles[column.className]} key={`${column.key ?? "icon"}-${index}`} />)}</colgroup>
      <thead><tr>{columns.map((column, index) => <th key={`${column.key ?? "icon"}-${index}`} scope="col" aria-sort={column.key && props.sort.key === column.key ? (props.sort.direction === "asc" ? "ascending" : "descending") : undefined}>
        {index === 0 ? props.selectionMode ? <CaseSelectionHeader
          locale={props.locale}
          visibleCount={props.rows.filter((row) => props.selectableIds.has(row.testCase.id)).length}
          allCount={props.selectableCount}
          selectedCount={props.selectedCount}
          disabled={props.interactionLocked}
          visibleCoverage={props.visibleCoverage}
          onToggleVisible={() => props.onToggleScope(props.rows.filter((row) => props.selectableIds.has(row.testCase.id)).map((row) => row.testCase.id))}
          onSelectVisible={props.onSelectVisible}
          onSelectAll={props.onSelectAll}
          onClear={props.onClearSelection}
        /> : <span aria-hidden="true" /> : column.key ? <button onClick={() => props.onSort(column.key!)}>
          {ru ? column.ru : column.en}
          {props.sort.key === column.key && (props.sort.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
        </button> : <span aria-hidden="true" />}
      </th>)}</tr></thead>
      <tbody>{groups.map((group) => {
        const isGrouped = effectiveGroup !== "none";
        const isCollapsed = collapsed.has(group.key);
        return <Fragment key={group.key}>
          {isGrouped && <tr className={styles.groupRow} key={`${group.key}-heading`}><td colSpan={columns.length}>
            <div className={styles.groupHeading}>
              {props.selectionMode && <CaseSelectionCheckbox
                coverage={selectionCoverage(props.selectedIds, group.rows.filter((row) => props.selectableIds.has(row.testCase.id)).map((row) => row.testCase.id))}
                disabled={props.interactionLocked || !group.rows.some((row) => props.selectableIds.has(row.testCase.id))}
                label={ru ? `Выбрать группу ${groupLabel(props.locale, effectiveGroup, group.value)}` : `Select ${groupLabel(props.locale, effectiveGroup, group.value)} group`}
                onToggle={() => props.onToggleScope(group.rows.filter((row) => props.selectableIds.has(row.testCase.id)).map((row) => row.testCase.id))}
              />}
              <button onClick={() => setCollapsed((current) => {
                const next = new Set(current); next.has(group.key) ? next.delete(group.key) : next.add(group.key); return next;
              })}>{isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}<strong>{groupLabel(props.locale, effectiveGroup, group.value)}</strong><small>{group.rows.length}</small></button>
            </div>
          </td></tr>}
          {!isCollapsed && group.rows.map((row) => {
            const item = row.testCase;
            const selected = item.id === props.selectedCaseId;
            const bulkSelected = props.selectedIds.has(item.id);
            const selectable = props.selectableIds.has(item.id);
            return <tr key={item.id} data-case-row data-case-id={item.id} data-interaction-locked={props.interactionLocked || undefined} data-bulk-selected={bulkSelected || undefined} className={selected ? styles.selectedRow : ""} aria-selected={selected} aria-disabled={props.interactionLocked || undefined} title={props.interactionLocked ? lockedTitle : undefined} tabIndex={tabStopId === item.id ? 0 : -1}
              onClick={() => props.interactionLocked ? props.onLockedInteraction?.() : props.onSelect(row)} onKeyDown={(event) => {
                if (event.target instanceof Element && event.target.closest("input, button, a, select, textarea")) return;
                if (props.interactionLocked && ["Enter", " ", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  props.onLockedInteraction?.();
                } else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onSelect(row); }
                else moveFocus(event);
              }}>
              <td className={styles.selectionCell}>{props.selectionMode && <CaseSelectionCheckbox coverage={bulkSelected ? "all" : "none"} disabled={props.interactionLocked || !selectable} label={selectable ? (ru ? `Выбрать ${item.key}` : `Select ${item.key}`) : (ru ? `${item.key} недоступен для массовых действий` : `${item.key} is unavailable for bulk actions`)} onToggle={() => props.onToggleCase(item.id)} />}</td>
              <td className={styles.flagCell}><AlertTriangle className={styles[`priorityFlag_${item.priority}`]} size={13} aria-label={localizedLabel(props.locale, item.priority)} /></td>
              <td className={styles.typeCell}>{item.type === "manual" ? <Hand size={13} aria-label={ru ? "Ручной" : "Manual"} /> : <ListChecks size={13} aria-label={ru ? "Чеклист" : "Checklist"} />}</td>
              <td className={styles.keyCell} title={item.key}><strong>{item.key}</strong></td>
              <td><LifecycleBadge locale={props.locale} lifecycle={item.lifecycle} archived={Boolean(item.archivedAt)} /></td>
              <td className={styles.titleCell}><strong title={`${item.title}\n${row.folderPath}`}>{item.title}</strong></td>
              <td className={styles.truncate} title={localizedComponentLabel(props.locale, item.component)}>{localizedComponentLabel(props.locale, item.component) || "—"}</td>
              <td><PriorityBadge locale={props.locale} priority={item.priority} /></td>
              <td className={styles.estimateCell}>{item.estimatedMinutes === null ? "—" : `${item.estimatedMinutes} ${ru ? "мин" : "min"}`}</td>
            </tr>;
          })}
        </Fragment>;
      })}</tbody>
    </table>
  </div>;
}
