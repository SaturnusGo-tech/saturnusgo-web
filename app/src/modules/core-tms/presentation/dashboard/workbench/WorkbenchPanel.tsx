"use client";

import { useId } from "react";
import type { DashboardDrillRow } from "../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { WorkbenchStatus } from "./controls/WorkbenchStatus";
import { WorkbenchRows } from "./rows/WorkbenchRows";
import styles from "./workbench.module.css";

export function WorkbenchPanel({ model, onOpenRow }: {
  model: DashboardWorkbenchModel; onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { languageTag, t } = useTmsLocale();
  const id = useId();
  const tabs = ["activeRuns", "readyForRetest"] as const;
  const queue = model.snapshot?.queues[model.tab];
  const updated = model.snapshot && new Intl.DateTimeFormat(languageTag, {
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(model.snapshot.generatedAt));

  return <section className={`${styles.panel} ${styles.queuePanel}`} aria-labelledby={`${id}-title`} aria-busy={model.loading}>
    <header className={styles.heading}><h2 id={`${id}-title`}>{t("dashboardWorkbench.title")}</h2>
      {updated && <small>{t("dashboardWorkbench.updated", { date: updated })}</small>}</header>
    <div className={styles.tabs} role="tablist" aria-label={t("dashboardWorkbench.title")}>
      {tabs.map((tab) => <button type="button" role="tab" key={tab} id={`${id}-${tab}`}
        aria-controls={`${id}-content`} aria-selected={model.tab === tab} tabIndex={model.tab === tab ? 0 : -1}
        onClick={() => model.selectTab(tab)} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs[1]
            : tab === tabs[0] ? tabs[1] : tabs[0];
          model.selectTab(next);
          document.getElementById(`${id}-${next}`)?.focus();
        }}>
        {t(`dashboardWorkbench.${tab}`)}
        <span>{model.snapshot?.queues[tab].total ?? "—"}</span>
      </button>)}
    </div>
    <div className={styles.queueContent} id={`${id}-content`} role="tabpanel" aria-labelledby={`${id}-${model.tab}`} tabIndex={0}>
      <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={Boolean(model.snapshot)}
        enabled={model.enabled} onRetry={model.refresh} />
      {queue && <div className={styles.preview}><WorkbenchRows queue={queue} onOpenRow={onOpenRow} /></div>}
    </div>
    {queue && <footer className={styles.footer}>
      <span>{t("dashboardWorkbench.totalRows", { shown: queue.rows.length, total: queue.total })}</span>
      <button type="button" onClick={() => model.openDrill(model.tab)}>{t("dashboardWorkbench.viewAll")}</button>
    </footer>}
  </section>;
}
