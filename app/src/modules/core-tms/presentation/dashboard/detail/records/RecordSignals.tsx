import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import { runProgress } from "../../workbench/rows/progress/model";
import styles from "./signals.module.css";
export function DetailStatus({ status }: { status?: string }) {
  const { locale } = useTmsLocale();
  return status ? <span className={styles.status} data-status={status} title={localizedLabel(locale, status)}>{localizedLabel(locale, status)}</span> : <>—</>;
}
export function DetailProgress({ progress }: { progress: NonNullable<DashboardDrillRow["progress"]> }) {
  const { locale } = useTmsLocale(); const value = runProgress(progress);
  const description = locale === "ru" ? `${value.completed} из ${value.total} проверок с результатом` : `${value.completed} of ${value.total} checks with a result`;
  return <span className={styles.progress} title={description}>
    <span className={styles.track} role="progressbar" aria-label={locale === "ru" ? "Проверки с результатом" : "Checks with a result"}
      aria-valuetext={description} aria-valuemin={0} aria-valuemax={value.total || 1} aria-valuenow={value.completed}>
      {value.segments.map(segment => <span key={segment.kind} data-kind={segment.kind} style={{ width: `${segment.percent}%` }} />)}
    </span><span>{value.completed}<i>/</i>{value.total}</span>
  </span>;
}
