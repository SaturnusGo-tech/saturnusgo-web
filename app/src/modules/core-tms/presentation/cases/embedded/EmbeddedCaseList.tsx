import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { ChevronDown } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import { CaseTypeIcon, LifecycleBadge } from "../list/CaseBadges";
import { PrioritySignal, prioritySignalRank } from "../list/PrioritySignal";
import styles from "./embeddedCaseList.module.css";

type Props = {
  cases: TestCaseSummary[];
  locale: TmsLocale;
  ariaLabel: string;
  emptyLabel: string;
  selectedIds?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  selectionDisabled?: boolean;
  onOpen?: (item: TestCaseSummary) => void;
  maxHeight?: string;
};

export function EmbeddedCaseList({
  cases,
  locale,
  ariaLabel,
  emptyLabel,
  selectedIds,
  onToggle,
  selectionDisabled = false,
  onOpen,
  maxHeight,
}: Props) {
  const ru = locale === "ru";
  const selectable = Boolean(selectedIds && onToggle);
  const [prioritySort, setPrioritySort] = useState<"asc" | "desc" | null>(null);
  const visibleCases = useMemo(() => {
    if (!prioritySort) return cases;
    const direction = prioritySort === "asc" ? 1 : -1;
    return [...cases].sort((left, right) => (
      (prioritySignalRank[left.priority] - prioritySignalRank[right.priority]) * direction
      || left.key.localeCompare(right.key, locale, { numeric: true, sensitivity: "base" })
    ));
  }, [cases, locale, prioritySort]);
  const columns = (
    <>
      {selectable && <span className={styles.selectionHeading} aria-hidden="true" />}
      <span className={styles.priorityHeading} aria-sort={prioritySort === "asc" ? "ascending" : prioritySort === "desc" ? "descending" : "none"}>
        <button type="button" className={styles.prioritySortButton} onClick={() => setPrioritySort((current) => current === "desc" ? "asc" : "desc")}
          aria-label={ru ? "Сортировать по приоритету" : "Sort by priority"} title={ru ? "Сортировать по приоритету" : "Sort by priority"}
          data-active={Boolean(prioritySort) || undefined} data-direction={prioritySort ?? undefined}>
          <ChevronDown size={14} /><span className={styles.visuallyHidden}>{ru ? "Приоритет" : "Priority"}</span>
        </button>
      </span>
      <span className={styles.typeHeading} aria-hidden="true" />
      <span>{ru ? "ID" : "ID"}</span>
      <span className={styles.statusHeading}>{ru ? "Статус" : "Status"}</span>
      <span>{ru ? "Тест-кейс" : "Test case"}</span>
      <span className={styles.componentHeading}>{ru ? "Функциональность" : "Functionality"}</span>
      <span className={styles.estimateHeading}>{ru ? "Оценка" : "Estimate"}</span>
    </>
  );

  return (
    <div
      className={styles.root}
      data-selectable={selectable || undefined}
      style={maxHeight ? { "--embedded-case-list-height": maxHeight } as CSSProperties : undefined}
    >
      <div className={styles.header}>{columns}</div>
      <div className={styles.body} role="group" aria-label={ariaLabel}>
        {cases.length === 0 && <div className={styles.empty}>{emptyLabel}</div>}
        {visibleCases.map((item) => {
          const checked = selectedIds?.has(item.id) ?? false;
          const content = (
            <>
              {selectable && (
                <span className={styles.selectionCell}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={selectionDisabled}
                    aria-label={ru ? `Выбрать ${item.key}` : `Select ${item.key}`}
                    onChange={() => onToggle?.(item.id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </span>
              )}
              <span className={styles.priorityCell}><PrioritySignal priority={item.priority} label={localizedLabel(locale, item.priority)} size={14} /></span>
              <span className={styles.typeCell}><CaseTypeIcon locale={locale} type={item.type} /></span>
              <strong className={styles.key} title={item.key}>{item.key}</strong>
              <span className={styles.status}><LifecycleBadge locale={locale} lifecycle={item.lifecycle} archived={Boolean(item.archivedAt)} /></span>
              <span className={styles.title} title={item.title}>{item.title}</span>
              <span className={styles.component} title={localizedComponentLabel(locale, item.component)}>{localizedComponentLabel(locale, item.component) || "—"}</span>
              <span className={styles.estimate}>{item.estimatedMinutes === null ? "—" : `${item.estimatedMinutes} ${ru ? "мин" : "min"}`}</span>
            </>
          );
          if (selectable) {
            return (
              <label key={item.id} className={styles.row} data-selected={checked || undefined} data-disabled={selectionDisabled || undefined}>
                {content}
              </label>
            );
          }
          return (
            <button key={item.id} type="button" className={styles.row} data-actionable={Boolean(onOpen) || undefined} onClick={() => onOpen?.(item)}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
