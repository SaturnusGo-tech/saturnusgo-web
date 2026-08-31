import { ArrowDown, ArrowUp, ChevronsUpDown, ListChecks, Search } from "lucide-react";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import { LifecycleBadge, PriorityBadge } from "./CaseBadges";
import type { CaseListRow, CaseSort, CaseSortKey } from "../types";
import styles from "../cases.module.css";

type Props = {
  locale: TmsLocale;
  rows: CaseListRow[];
  selectedCaseId: string;
  sort: CaseSort;
  onSort: (key: CaseSortKey) => void;
  onSelect: (row: CaseListRow) => void;
  onCreate: () => void;
};

export function CasesTable(props: Props) {
  const ru = props.locale === "ru";
  const columns: Array<{ key: CaseSortKey; label: string; className: string }> = [
    { key: "key", label: "ID", className: styles.keyColumn },
    { key: "title", label: ru ? "Название" : "Title", className: styles.titleColumn },
    { key: "lifecycle", label: ru ? "Состояние" : "Status", className: styles.statusColumn },
    { key: "priority", label: ru ? "Приоритет" : "Priority", className: styles.priorityColumn },
    { key: "component", label: ru ? "Компонент" : "Component", className: styles.componentColumn },
    { key: "estimate", label: ru ? "Оценка" : "Estimate", className: styles.estimateColumn },
  ];
  return (
    <div className={styles.tableScroll}>
      {props.rows.length === 0 ? <div className={styles.listEmpty}>
        <Search size={24} />
        <strong>{ru ? "Ничего не найдено" : "Nothing found"}</strong>
        <span>{ru ? "Измените запрос или фильтры." : "Adjust the search or filters."}</span>
        <button className={styles.secondaryButton} onClick={props.onCreate}><ListChecks size={15} />{ru ? "Создать кейс" : "Create case"}</button>
      </div> : <table className={styles.caseTable}>
        <colgroup>
          {columns.map((column) => <col className={column.className} key={column.key} />)}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key} scope="col" aria-sort={props.sort.key === column.key ? (props.sort.direction === "asc" ? "ascending" : "descending") : "none"}>
              <button onClick={() => props.onSort(column.key)}>
                {column.label}
                {props.sort.key !== column.key ? <ChevronsUpDown size={13} /> : props.sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              </button>
            </th>)}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, index) => {
            const selected = row.testCase.id === props.selectedCaseId;
            return <tr
              key={row.testCase.id}
              className={selected ? styles.tableRowSelected : ""}
              aria-selected={selected}
              tabIndex={selected || (!props.selectedCaseId && index === 0) ? 0 : -1}
              onClick={() => props.onSelect(row)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onSelect(row);
                  return;
                }
                if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const nextIndex = event.key === "Home" ? 0
                    : event.key === "End" ? props.rows.length - 1
                    : Math.max(0, Math.min(props.rows.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
                  const target = event.currentTarget.parentElement?.children.item(nextIndex);
                  if (target instanceof HTMLTableRowElement) target.focus();
                  props.onSelect(props.rows[nextIndex]);
                }
              }}
            >
              <td className={styles.keyCell}>
                <span className={styles.keyCellContent}>
                  <span className={`${styles.caseTypeMark} ${styles[`mark_${row.testCase.lifecycle}`]}`}><ListChecks size={14} /></span>
                  <strong>{row.testCase.key}</strong>
                </span>
              </td>
              <td>
                <span className={styles.titleCellContent}>
                  <strong title={row.testCase.title}>{row.testCase.title}</strong>
                  <small title={row.folderPath}>{row.folderPath}</small>
                </span>
              </td>
              <td><LifecycleBadge locale={props.locale} lifecycle={row.testCase.lifecycle} archived={Boolean(row.testCase.archivedAt)} /></td>
              <td><PriorityBadge locale={props.locale} priority={row.testCase.priority} /></td>
              <td className={styles.truncatedCell} title={localizedComponentLabel(props.locale, row.testCase.component)}>
                {localizedComponentLabel(props.locale, row.testCase.component) || "—"}
              </td>
              <td className={styles.estimateCell}>{row.testCase.estimatedMinutes === null ? "—" : `${row.testCase.estimatedMinutes} ${ru ? "мин" : "min"}`}</td>
            </tr>;
          })}
        </tbody>
      </table>}
    </div>
  );
}
