import { ArrowUpRight } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { WorkbenchQueue } from "../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import styles from "../workbench.module.css";

type Props = { queue: WorkbenchQueue; onOpenRow: (row: DashboardDrillRow) => void; detail?: boolean };

export function WorkbenchRows({ queue, onOpenRow, detail = false }: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const date = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (!queue.rows.length) return <p className={styles.empty}>{t("dashboardWorkbench.empty")}</p>;
  return <ul className={styles.rows}>
    {queue.rows.map((row) => {
      const record = row.navigation;
      return <li key={`${record.projectId}:${record.entity}:${record.id}`}>
        <button type="button" className={styles.row} onClick={() => onOpenRow(record)}
          aria-label={t("dashboardWorkbench.open", { key: record.key })}>
          <div className={styles.rowTitle}>
            <span className={styles.recordKey}>{record.key}</span><strong>{record.title}</strong>
            <ArrowUpRight size={14} aria-hidden="true" />
          </div>
          <div className={styles.rowContext}>
            <span>{record.project}</span><span>{row.environmentName ?? t("dashboardWorkbench.noEnvironment")}</span>
            <span className={styles.build}>{row.buildReference || t("dashboardWorkbench.noBuild")}</span>
          </div>
          <div className={styles.rowSignals}>
            {record.status && <span className={styles.status} data-status={record.status}>{localizedLabel(locale, record.status)}</span>}
            {row.progress && <>
              <span>{t("dashboardWorkbench.itemCount", { count: row.progress.total })}</span>
              <span>{t("dashboardWorkbench.passedCount", { count: row.progress.passed })}</span>
              {row.progress.failed > 0 && <span data-status="failed">{t("dashboardWorkbench.failedCount", { count: row.progress.failed })}</span>}
              {row.progress.blocked > 0 && <span data-status="blocked">{t("dashboardWorkbench.blockedCount", { count: row.progress.blocked })}</span>}
            </>}
            {record.priority && <span>{localizedLabel(locale, record.priority)}</span>}
            {row.attemptNo !== undefined && <span>{t("dashboardWorkbench.attempt", { count: row.attemptNo })}</span>}
            {detail && <time dateTime={row.updatedAt}>{date.format(new Date(row.updatedAt))}</time>}
          </div>
          {row.snapshotRevisionNo !== undefined && row.currentRevisionNo !== undefined &&
            <small className={styles.revision}>{t("dashboardWorkbench.revision", {
              snapshot: row.snapshotRevisionNo, current: row.currentRevisionNo,
            })}</small>}
        </button>
      </li>;
    })}
  </ul>;
}
