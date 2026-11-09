import { ChevronRight } from "lucide-react";
import type { DashboardDrillRow } from "../../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../localization/format/labels";
import { PriorityIcon, priorityLabel } from "../../../../common/properties/PriorityIcon";
import { DefectStatusIcon } from "../../../../common/properties/defect/DefectStatusIcon";
import { isPrioritySignalLevel } from "../../../../cases/list/priority/PrioritySignal";
import styles from "./defectDrillList.module.css";

export function DefectDrillList({ rows, onOpenRow }: {
  rows: DashboardDrillRow[]; onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const label = t("dashboard.defects");
  const date = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short" });
  return <section className={styles.list} aria-label={label} data-defect-drill-list>
    <div className={styles.group} aria-hidden="true">{label}</div>
    <ul>
      {rows.map(row => {
        const level = isPrioritySignalLevel(row.priority) ? row.priority : null;
        const priority = priorityLabel(locale, level);
        const status = row.status ? localizedLabel(locale, row.status) : "";
        const dateValue = row.occurredAt ? Date.parse(row.occurredAt) : NaN;
        return <li key={`${row.projectId}:${row.id}`}>
          <button type="button" className={styles.row} onClick={() => onOpenRow(row)}>
            <span className={styles.priority} role="img" aria-label={priority} title={priority}>
              <PriorityIcon level={level} empty="circle" size={15} />
            </span>
            {row.status ? <DefectStatusIcon status={row.status} label={status} /> : <span aria-hidden="true" />}
            <span className={styles.title} title={row.title}>{row.title}</span>
            <span className={styles.product} title={row.component}>{row.component || "—"}</span>
            {Number.isFinite(dateValue)
              ? <time className={styles.date} dateTime={row.occurredAt}>{date.format(dateValue)}</time>
              : <span className={styles.date}>—</span>}
            <ChevronRight size={14} className={styles.arrow} aria-hidden="true" />
          </button>
        </li>;
      })}
    </ul>
  </section>;
}
