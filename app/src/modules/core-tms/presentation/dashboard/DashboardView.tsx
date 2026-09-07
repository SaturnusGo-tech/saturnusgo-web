"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardDrillRow, DashboardPeriod } from "../../dashboards/model/dashboard-analytics";
import { createHttpDashboardAnalyticsSource } from "../../dashboards/source/http-dashboard-analytics-source";
import { useDashboardWorkbench } from "../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
import { AnimatedSelect } from "../common/select/AnimatedSelect";
import { DashboardTrendChart } from "./charts/DashboardTrendChart";
import { useDashboardAnalytics } from "./controller/useDashboardAnalytics";
import surface from "./dashboard.module.css";
import { DashboardDrillInspector } from "./inspector/DashboardDrillInspector";
import type { DashboardDrillTab } from "./inspector/dashboard-drill-navigation";
import { DashboardLibrary } from "./overview/DashboardLibrary";
import { DashboardMetrics } from "./overview/DashboardMetrics";
import { DashboardPortfolio } from "./sections/DashboardPortfolio";
import { FreshnessPanel } from "./workbench/FreshnessPanel";
import { WorkbenchPanel } from "./workbench/WorkbenchPanel";
import { WorkbenchContextBar } from "./workbench/controls/WorkbenchContextBar";
import { WorkbenchDrillInspector } from "./workbench/inspector/WorkbenchDrillInspector";

type DashboardViewProps = {
  data: Bootstrap;
  projectId: string;
  onCreate: () => void;
  onOpenEntity: (tab: DashboardDrillTab, drill: DashboardDrill) => void;
  onOpenRow: (row: DashboardDrillRow) => void;
  onCreateRun: (caseIds: string[]) => void;
  serverAnalytics?: boolean;
  analyticsSource?: DashboardAnalyticsSource;
};

export function DashboardView({ data, projectId, onOpenEntity, onOpenRow,
  onCreateRun, serverAnalytics = false, analyticsSource }: DashboardViewProps) {
  const { languageTag, t } = useTmsLocale();
  const http = useTmsHttpClient();
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [workspaceScope, setWorkspaceScope] = useState(false);
  const scope = useMemo(() => ({ workspaceId: data.workspace.id,
    ...(workspaceScope ? {} : { projectId }),
  }), [data.workspace.id, projectId, workspaceScope]);
  const query = useMemo(() => ({ ...scope, period }), [scope, period]);
  const httpSource = useMemo(() => serverAnalytics
    ? createHttpDashboardAnalyticsSource(http, data)
    : undefined, [data, http, serverAnalytics]);
  const analytics = useDashboardAnalytics(data, query, analyticsSource ?? httpSource);
  const workbench = useDashboardWorkbench(scope, serverAnalytics);
  const snapshot = analytics.snapshot;
  const currentProject = data.projects.find((project) => project.id === projectId)?.name ?? projectId;
  const updatedAt = snapshot ? new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(snapshot.generatedAt)) : null;
  const refresh = () => { analytics.refresh(); workbench.refresh(); };

  return <div className={`${styles.pageScroll} ${surface.page}`} data-dashboard-workspace="true">
    <header className={surface.header}>
      <div className={surface.titleRow}><h1>{t("dashboard.analyticsTitle")}</h1>
        <p>{t("dashboard.analyticsDescription")}</p></div>
      <div className={surface.filterBar}>
        <label><span>{t("dashboard.scope")}</span><AnimatedSelect compact className={surface.scopeSelect}
          label={t("dashboard.scope")} value={workspaceScope ? "workspace" : "project"}
          onChange={(value) => setWorkspaceScope(value === "workspace")} options={[
            { value: "project", label: currentProject },
            { value: "workspace", label: t("dashboard.workspaceScope") },
          ]} /></label>
        <button type="button" className={surface.refreshButton} onClick={refresh}
          aria-label={t("dashboard.refresh")} title={t("dashboard.refresh")}>
          <RefreshCw className={analytics.summaryLoading || workbench.loading ? surface.spin : undefined} size={15} />
        </button>
      </div>
    </header>
    <WorkbenchContextBar model={workbench} />
    <DashboardMetrics model={workbench} />
    <div className={surface.primaryGrid}>
      <div className={surface.historyColumn}>
        {analytics.summaryError && <span className={surface.syncError} role="alert">
          {t(snapshot ? "dashboard.staleAnalytics" : "dashboard.summaryError")}
          <button type="button" className={surface.refreshButton} onClick={analytics.refresh} aria-label={t("dashboard.retry")}><RefreshCw size={15} /></button>
        </span>}
        {snapshot ? <DashboardTrendChart snapshot={snapshot} onOpenDrill={analytics.openDrill} onPeriodChange={setPeriod} />
          : <section className={surface.chartPanel}><div className={surface.summaryState} role="status">
            {analytics.summaryLoading && <><LoaderCircle className={surface.spin} size={22} /><span>{t("dashboard.summaryLoading")}</span></>}
          </div></section>}
      </div>
      <WorkbenchPanel model={workbench} onOpenRow={onOpenRow} />
    </div>
    <div className={surface.secondaryGrid}>
      {snapshot && <DashboardPortfolio snapshot={snapshot} onOpenDrill={analytics.openDrill} />}
      <FreshnessPanel model={workbench} />
    </div>
    {snapshot && <DashboardLibrary snapshot={snapshot} onOpenDrill={analytics.openDrill} />}
    {updatedAt && <p className={surface.updatedAt}>{t("dashboard.historicalUpdated", { date: updatedAt })}</p>}
    <WorkbenchDrillInspector model={workbench} onOpenRow={onOpenRow} />
    {analytics.drill.selected && analytics.drill.origin && <DashboardDrillInspector
      query={query} origin={analytics.drill.origin} selected={analytics.drill.selected} page={analytics.drill.page}
      loading={analytics.drill.loading} error={analytics.drill.error}
      scopeLabel={analytics.drill.origin.projectId
        ? data.projects.find((item) => item.id === analytics.drill.origin?.projectId)?.name ?? currentProject
        : workspaceScope ? t("dashboard.workspaceScope") : currentProject}
      onSelectDrill={analytics.selectRelatedDrill} onOpenEntity={onOpenEntity}
      onOpenRow={onOpenRow} onCreateRun={onCreateRun}
      onClose={analytics.closeDrill} onRetry={analytics.retryDrill} onLoadMore={analytics.loadMore}
    />}
  </div>;
}
