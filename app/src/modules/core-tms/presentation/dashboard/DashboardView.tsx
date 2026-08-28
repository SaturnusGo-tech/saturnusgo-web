import { Activity as ActivityIcon, Bug, CheckCircle2, ChevronRight, FolderKanban, PlayCircle, Plus } from "lucide-react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import { activityLabel } from "../../localization/activity/label";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
export function DashboardView({ data, projectId, onCreate, onOpenRuns }: { data: Bootstrap; projectId: string; onCreate: () => void; onOpenRuns: () => void }) {
  const { locale, t } = useTmsLocale();
  const cases = data.testCases.filter((item) => item.projectId === projectId && !item.archivedAt);
  const runs = data.runs.filter((item) => item.projectId === projectId);
  const defects = data.defects.filter((item) => item.projectId === projectId && !["verified", "closed"].includes(item.status));
  const finishedItems = runs.flatMap((run) => run.items).filter((item) => item.status !== "not_run");
  const passRate = finishedItems.length
    ? Math.round((finishedItems.filter((item) => item.status === "passed").length / finishedItems.length) * 100)
    : 0;

  return (
    <div className={styles.pageScroll}>
      <SectionHeading
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        action={<button className={styles.secondaryButton} onClick={onCreate}><Plus size={16} /> {t("dashboard.create")}</button>}
      />
      <div className={styles.metricGrid}>
        {[
          [t("dashboard.testCases"), cases.length, t("dashboard.readyCases"), <FolderKanban key="cases" size={21} />],
          [t("dashboard.activeRuns"), runs.filter((item) => item.status === "active").length, t("dashboard.smokeRegression"), <PlayCircle key="runs" size={21} />],
          [t("dashboard.passRate"), `${passRate}%`, t("dashboard.executedCases"), <CheckCircle2 key="pass" size={21} />],
          [t("dashboard.openDefects"), defects.length, t("dashboard.needAttention"), <Bug key="bugs" size={21} />],
        ].map(([label, value, hint, icon]) => (
          <article className={styles.metricCard} key={String(label)}>
            <div className={styles.metricIcon}>{icon}</div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}><div><h2>{t("dashboard.recentRuns")}</h2><p>{t("dashboard.releaseStatus")}</p></div><button className={styles.textButton} onClick={onOpenRuns}>{t("dashboard.openAll")} <ChevronRight size={15} /></button></div>
          {runs.length === 0 ? (
            <EmptyState icon={<PlayCircle size={28} />} title={t("dashboard.noRuns")} text={t("dashboard.noRunsHint")} />
          ) : (
            <div className={styles.simpleList}>
              {runs.slice(0, 5).map((run) => {
                const completed = run.items.filter((item) => ["passed", "failed", "blocked", "skipped"].includes(item.status)).length;
                const progress = Math.round((completed / Math.max(run.items.length, 1)) * 100);
                return <button key={run.id} onClick={onOpenRuns} className={styles.runRow}>
                  <span className={`${styles.statusDot} ${styles[`status_${run.status === "active" ? "in_progress" : "passed"}`]}`} />
                  <span><strong>{run.name}</strong><small>{run.key} · {run.environment.name}</small></span>
                  <div className={styles.progressMini}><i style={{ width: `${progress}%` }} /></div>
                  <b>{progress}%</b>
                </button>;
              })}
            </div>
          )}
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHeader}><div><h2>{t("dashboard.activity")}</h2><p>{t("dashboard.latestChanges")}</p></div><ActivityIcon size={18} /></div>
          <div className={styles.timeline}>
            {data.activity.slice(0, 7).map((entry) => <div className={styles.timelineItem} key={entry.id}>
              <span>{entry.actor.slice(0, 1).toUpperCase()}</span>
              <div><strong>{activityLabel(locale, entry.action)}</strong><small>{entry.entityKey ?? t("dashboard.workspace")} · {new Date(entry.createdAt).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}</small></div>
            </div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
