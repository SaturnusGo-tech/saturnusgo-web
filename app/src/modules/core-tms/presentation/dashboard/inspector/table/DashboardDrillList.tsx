import { ChevronRight, CirclePlay, ExternalLink } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { DetailProgress, DetailStatus } from "../../detail/records/RecordSignals";
import { DefectDrillList } from "./defects/DefectDrillList";
import styles from "./drill-list.module.css";

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

export function DashboardDrillList({ rows, onOpenRow }: {
  rows: DashboardDrillRow[]; onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { languageTag, t } = useTmsLocale();
  if (!rows.length) return null;
  if (rows[0].entity === "defect") return <DefectDrillList rows={rows} onOpenRow={onOpenRow} />;
  const label = t("dashboard.runs");
  const formatDate = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short" });

  return <section className={styles.list} aria-label={label} data-run-drill-list>
    <div className={styles.group} aria-hidden="true">{label}</div>
    <ul>{rows.map(row => {
      const date = row.occurredAt ? Date.parse(row.occurredAt) : NaN;
      const link = row.links.find(item => safeUrl(item.url));
      return <li key={`${row.projectId}:${row.id}`}>
        <button type="button" className={styles.row} onClick={() => onOpenRow(row)} disabled={Boolean(row.archivedAt)}>
          <CirclePlay size={15} className={styles.icon} aria-hidden="true" />
          <span className={styles.title} title={row.title}>{row.title}</span>
          <span className={styles.progress}>{row.progress && <DetailProgress progress={row.progress} />}</span>
          <span className={styles.status}><DetailStatus status={row.status} /></span>
          {Number.isFinite(date)
            ? <time className={styles.date} dateTime={row.occurredAt}>{formatDate.format(date)}</time>
            : <span className={styles.date}>—</span>}
          <span className={styles.key} title={row.key}>{row.key}</span>
          <ChevronRight size={14} className={styles.icon} aria-hidden="true" />
        </button>
        {link && <a className={styles.external} href={safeUrl(link.url)!} target="_blank" rel="noreferrer noopener"
          aria-label={t("dashboard.openExternalLink", { label: link.label })}><ExternalLink size={13} /></a>}
      </li>;
    })}</ul>
  </section>;
}
