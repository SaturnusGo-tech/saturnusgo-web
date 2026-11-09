import type { ReactNode } from "react";
import type { InsightGroup, InsightMeasure } from "../model/insight-view";
import styles from "./insights-list.module.css";

export function InsightsList({ groups, number, dimension, metric, empty, selected, onSelect, updating }: {
  groups: InsightGroup[]; number: Intl.NumberFormat; dimension: string; metric: string; empty: string;
  selected?: string; onSelect?: (item: InsightMeasure) => void; updating?: boolean;
}) {
  const format = (item: InsightMeasure) => item.count === undefined ? "—" : number.format(item.count);
  const action = (item: InsightMeasure, className: string, label: string, content: ReactNode) =>
    onSelect && item.drill && item.count ? <button type="button" className={className} aria-label={`${label} · ${format(item)}`}
      aria-pressed={item.drill.id === selected} aria-disabled={updating || undefined}
      onClick={updating ? undefined : () => onSelect(item)}>{content}</button> : <span className={className}>{content}</span>;

  return <div className={styles.scroll} tabIndex={0} role="region" aria-label={`${dimension} · ${metric}`}>
    {groups.length ? <ul className={styles.list} role="list">
      {groups.map(group => {
        const parts = group.cells.filter(part => Boolean(part.count));
        return <li className={styles.group} key={group.key}>
          {action(group, styles.groupAction, group.label, <>
            {!parts.length && <i className={styles.dot} style={{ backgroundColor: group.color }} aria-hidden="true" />}
            <span>{group.label}</span><strong>{format(group)}</strong>
          </>)}
          {parts.length > 0 && <ul className={styles.segments} role="list">
            {parts.map(part => <li key={part.key}>
              {action(part, styles.segment, `${group.label} · ${part.label}`, <>
                <i className={styles.dot} style={{ backgroundColor: part.color }} aria-hidden="true" />
                <span>{part.label}</span><strong>{format(part)}</strong>
              </>)}
            </li>)}
          </ul>}
        </li>;
      })}
    </ul> : <p className={styles.empty}>{empty}</p>}
  </div>;
}
