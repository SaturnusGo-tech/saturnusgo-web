import { Activity, ChevronRight, PlayCircle } from "lucide-react";
import { activityLabel } from "../../../localization/activity/label";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import surface from "../dashboard.module.css";
import type { DashboardSnapshot } from "../model/createDashboardSnapshot";

export function DashboardOperations({
  snapshot,
  onOpenRuns,
}: {
  snapshot: DashboardSnapshot;
  onOpenRuns: () => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const dateTime = (value: string) => new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

  return (
    <div className={surface.operationsGrid}>
      <section className={surface.operationsPanel}>
        <header className={surface.panelHeading}>
          <div><h2>{t("dashboard.recentRuns")}</h2><p>{t("dashboard.releaseStatus")}</p></div>
        </header>
        {snapshot.recentRuns.length ? (
          <div className={surface.runTableWrap}>
            <table className={surface.runTable}>
              <thead><tr>
                <th>{t("dashboard.run")}</th>
                <th>{t("dashboard.environment")}</th>
                <th>{t("dashboard.passed")}</th>
                <th>{t("dashboard.failures")}</th>
                <th>{t("dashboard.passRate")}</th>
                <th>{t("dashboard.status")}</th>
              </tr></thead>
              <tbody>{snapshot.recentRuns.map((run) => {
                const passed = run.progress.counts.passed;
                const failed = run.progress.counts.failed;
                const rate = run.progress.executed
                  ? Math.round((passed / run.progress.executed) * 1000) / 10
                  : 0;
                return (
                  <tr key={run.id}>
                    <td><button onClick={onOpenRuns}><strong>{run.name}</strong><small>{run.key} · {dateTime(run.startedAt ?? run.createdAt)}</small></button></td>
                    <td>{run.environment.name}</td>
                    <td>{passed}</td>
                    <td className={failed ? surface.failureValue : undefined}>{failed}</td>
                    <td><span className={surface.rate}><i style={{ width: `${rate}%` }} /><b>{rate}%</b></span></td>
                    <td><span className={`${surface.status} ${surface[`status_${run.status}`]}`}>{localizedLabel(locale, run.status)}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <div className={surface.panelEmpty}><PlayCircle size={24} /><strong>{t("dashboard.noRuns")}</strong><span>{t("dashboard.noRunsHint")}</span></div>
        )}
        <button className={surface.panelLink} onClick={onOpenRuns}>{t("dashboard.openAll")} <ChevronRight size={15} /></button>
      </section>
      <section className={surface.operationsPanel}>
        <header className={surface.panelHeading}>
          <div><h2>{t("dashboard.activity")}</h2><p>{t("dashboard.latestChanges")}</p></div>
          <Activity size={17} aria-hidden="true" />
        </header>
        {snapshot.recentActivity.length ? (
          <ol className={surface.activityList}>
            {snapshot.recentActivity.map((entry) => (
              <li key={entry.id}>
                <span aria-hidden="true">{entry.actor.slice(0, 1).toUpperCase()}</span>
                <div><strong>{activityLabel(locale, entry.action)}</strong><small>{entry.entityKey ?? t("dashboard.workspace")}</small></div>
                <time dateTime={entry.createdAt}>{dateTime(entry.createdAt)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <div className={surface.panelEmpty}><Activity size={24} /><strong>{t("dashboard.noActivity")}</strong></div>
        )}
      </section>
    </div>
  );
}
