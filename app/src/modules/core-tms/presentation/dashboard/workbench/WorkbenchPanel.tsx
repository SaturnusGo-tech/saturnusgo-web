"use client";

import { useId } from "react";
import type { DashboardDrillRow } from "../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { DashboardSegments, dashboardTabId } from "../common/segments/DashboardSegments";
import { WorkbenchStatus } from "./controls/WorkbenchStatus";
import { WorkbenchRows } from "./rows/WorkbenchRows";
import styles from "./workbench.module.css";

export function WorkbenchPanel({ model, onOpenRow }: {
  model: Pick<DashboardWorkbenchModel, "snapshot" | "loading" | "error" | "enabled" | "refresh" | "tab" | "selectTab"> & Partial<Pick<DashboardWorkbenchModel, "openDrill">>; onOpenRow?: (row: DashboardDrillRow) => void;
}) {
  const { languageTag, t } = useTmsLocale();
  const id = useId();
  const panelId = `${id}-content`;
  const tabs = ["activeRuns", "readyForRetest"] as const;
  const queue = model.snapshot?.queues[model.tab];
  const updated = model.snapshot && new Intl.DateTimeFormat(languageTag, {
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(model.snapshot.generatedAt));

  return <section className={`${styles.panel} ${styles.queuePanel}`} aria-labelledby={`${id}-title`} aria-busy={model.loading}>
    <header className={styles.heading}><h2 id={`${id}-title`}>{t("dashboardWorkbench.title")}</h2>
      {updated && <small>{t("dashboardWorkbench.updated", { date: updated })}</small>}</header>
    <DashboardSegments label={t("dashboardWorkbench.title")} panelId={panelId} selectedKey={model.tab}
      listClassName={styles.tabs} onSelect={model.selectTab}
      items={tabs.map((key) => ({ key, label: t(`dashboardWorkbench.${key}`), badge: model.snapshot?.queues[key].total ?? "—" }))} />
    <div className={styles.queueContent} id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, model.tab)} tabIndex={0}>
      <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={Boolean(model.snapshot)}
        enabled={model.enabled} onRetry={model.refresh} />
      {queue && <div className={styles.preview}><WorkbenchRows queue={queue} onOpenRow={onOpenRow} /></div>}
    </div>
    {queue && <footer className={styles.footer}>
      <span>{t("dashboardWorkbench.totalRows", { shown: queue.rows.length, total: queue.total })}</span>
      {model.openDrill && <button type="button" onClick={() => model.openDrill?.(model.tab)}>{t("dashboardWorkbench.viewAll")}</button>}
    </footer>}
  </section>;
}
