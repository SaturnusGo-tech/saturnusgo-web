import { ArrowUpRight, Play } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { WorkbenchQueue } from "../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import { RunProgress } from "./progress/RunProgress";
import { queueCopy, runProgress } from "./progress/model";
import styles from "../workbench.module.css";

type Props = { queue: WorkbenchQueue; onOpenRow: (row: DashboardDrillRow) => void; detail?: boolean };

export function WorkbenchRows({ queue, onOpenRow, detail = false }: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const copy = queueCopy[locale];
  const format = new Intl.NumberFormat(languageTag);
  const date = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (!queue.rows.length) return <p className={styles.empty}>{t("dashboardWorkbench.empty")}</p>;
  return <ul className={styles.rows}>
    {queue.rows.map((row) => {
      const record = row.navigation;
      const progress = row.progress && runProgress(row.progress);
      const canContinue = progress && progress.completed < progress.total;
      const progressLabel = progress ? copy.completed(format.format(progress.completed), format.format(progress.total)) : "";
      return <li key={`${record.projectId}:${record.entity}:${record.id}`}>
        <button type="button" className={`${styles.row} ${row.progress && !detail ? styles.runRow : ""}`} onClick={() => onOpenRow(record)}
          aria-label={`${canContinue ? copy.continue : copy.open}: ${record.key}. ${record.title}. ${progressLabel}`}>
          <div className={styles.rowTitle}>
            <span className={styles.recordKey}>{record.key}</span><strong>{record.title}</strong>
            <ArrowUpRight size={14} aria-hidden="true" />
          </div>
          <div className={styles.rowContext}>
            <span>{record.project}</span><span>{row.environmentName ?? t("dashboardWorkbench.noEnvironment")}</span>
            <span className={styles.build}>{row.buildReference || t("dashboardWorkbench.noBuild")}</span>
          </div>
          {row.progress && <div className={styles.runExecution}>
            <RunProgress progress={row.progress} />
            <span className={styles.continue} data-primary={Boolean(canContinue)}>
              <Play size={13} fill="currentColor" aria-hidden="true" />{canContinue ? copy.continue : copy.open}
            </span>
          </div>}
          {(!row.progress || detail) && <div className={styles.rowSignals}>
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
          </div>}
          {row.snapshotRevisionNo !== undefined && row.currentRevisionNo !== undefined &&
            <small className={styles.revision}>{t("dashboardWorkbench.revision", {
              snapshot: row.snapshotRevisionNo, current: row.currentRevisionNo,
            })}</small>}
        </button>
      </li>;
    })}
  </ul>;
}
