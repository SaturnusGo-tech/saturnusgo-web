import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { Modal } from "../../../common/modal/Modal";
import { WorkbenchStatus } from "../controls/WorkbenchStatus";
import { WorkbenchRows } from "../rows/WorkbenchRows";
import styles from "../workbench.module.css";

export function WorkbenchDrillInspector({ model, onOpenRow }: {
  model: DashboardWorkbenchModel; onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { t } = useTmsLocale();
  const drill = model.drill;
  if (!drill) return null;
  const queue = drill.page?.queue;
  return <Modal sheet adaptiveSheet title={t(`dashboardWorkbench.${drill.kind}`)}
    subtitle={t("dashboardWorkbench.currentSnapshot")} onClose={model.closeDrill} panelClassName={styles.inspector}>
    <div className={styles.drillBody} aria-busy={drill.loading}>
      <WorkbenchStatus loading={drill.loading} error={drill.error} hasSnapshot={Boolean(drill.page)}
        onRetry={model.retryDrill} />
      {queue && <>
        <div className={styles.drillCount}>
          <span>{t("dashboardWorkbench.loadedRows", { shown: queue.rows.length, total: queue.total })}</span>
          <button type="button" onClick={model.refreshDrill} disabled={drill.loading}>{t("dashboardWorkbench.refreshList")}</button>
        </div>
        <WorkbenchRows queue={queue} detail onOpenRow={(row) => { model.closeDrill(); onOpenRow(row); }} />
        {drill.page?.nextCursor && !drill.error && <button type="button" className={styles.loadMore}
          onClick={model.loadMore} disabled={drill.loading}>{t("dashboardWorkbench.loadMore")}</button>}
        <p className={styles.truncation}>{t("dashboardWorkbench.livePages")}</p>
      </>}
    </div>
  </Modal>;
}
