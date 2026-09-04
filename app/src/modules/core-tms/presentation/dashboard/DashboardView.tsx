"use client";

import { BadgeCheck, Bug, FileCheck2, Link2, LoaderCircle, PlayCircle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardDrillRow, DashboardPeriod } from "../../dashboards/model/dashboard-analytics";
import { createHttpDashboardAnalyticsSource } from "../../dashboards/source/http-dashboard-analytics-source";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
import { AnimatedSelect } from "../common/select/AnimatedSelect";
import { DashboardBreakdowns } from "./charts/DashboardBreakdowns";
import { DashboardTrendChart } from "./charts/DashboardTrendChart";
import { useDashboardAnalytics } from "./controller/useDashboardAnalytics";
import surface from "./dashboard.module.css";
import { DashboardDrillInspector } from "./inspector/DashboardDrillInspector";
import type { DashboardDrillTab } from "./inspector/dashboard-drill-navigation";
import { DashboardOperations } from "./sections/DashboardOperations";
import { DashboardPortfolio } from "./sections/DashboardPortfolio";

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
  const query = useMemo(() => ({
    workspaceId: data.workspace.id,
    ...(workspaceScope ? {} : { projectId }),
    period,
  }), [data.workspace.id, period, projectId, workspaceScope]);
  const httpSource = useMemo(() => serverAnalytics
    ? createHttpDashboardAnalyticsSource(http, data)
    : undefined, [data, http, serverAnalytics]);
  const analytics = useDashboardAnalytics(data, query, analyticsSource ?? httpSource);
  const snapshot = analytics.snapshot;
  const currentProject = data.projects.find((project) => project.id === projectId)?.name ?? projectId;

  if (!snapshot) {
    return <div className={`${styles.pageScroll} ${surface.page}`}>
      <div className={surface.summaryState} role={analytics.summaryError ? "alert" : "status"}>
        {analytics.summaryLoading && <LoaderCircle className={surface.spin} size={22} />}
        <strong>{analytics.summaryError ? t("dashboard.summaryError") : t("dashboard.summaryLoading")}</strong>
        {analytics.summaryError && <button type="button" onClick={analytics.refresh}>{t("dashboard.retry")}</button>}
      </div>
    </div>;
  }

  const updatedAt = new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(snapshot.generatedAt));
  const linkCoverage = snapshot.metrics.currentDefects
    ? Math.round((snapshot.metrics.linkedDefects / snapshot.metrics.currentDefects) * 100)
    : 0;
  const metric = (id: string, label: string, value: string | number, hint: string, icon: ReactNode, tone: string, drill: DashboardDrill | null) => ({
    id, label, value, hint, icon, tone, drill: drill ? { ...drill, label } : null,
  });
  const metrics = [
    metric("cases", t("dashboard.currentCases"), snapshot.metrics.currentCases, t("dashboard.createdPeriod", { count: snapshot.metrics.casesCreated }), <FileCheck2 size={18} />, "metricNeutral", { id: "cases:current", label: "", filter: { entity: "test_case", basis: "current" } }),
    metric("runs", t("dashboard.launchedRuns"), snapshot.metrics.runsLaunched, t("dashboard.activeRunHint", { count: snapshot.metrics.activeRuns }), <PlayCircle size={18} />, "metricNeutral", { id: "runs:launched", label: "", filter: { entity: "run", basis: "launched" } }),
    metric("pass", t("dashboard.passRate"), snapshot.metrics.passRate === null ? "—" : `${snapshot.metrics.passRate}%`, t("dashboard.completedHint", { count: snapshot.metrics.completedRuns }), <BadgeCheck size={18} />, "metricSuccess", snapshot.metrics.passRate === null ? null : { id: "items:passed", label: "", filter: { entity: "run_item", status: "passed" } }),
    metric("defects", t("dashboard.openDefects"), snapshot.metrics.openDefects, t("dashboard.reportedPeriod", { count: snapshot.metrics.reportedDefects }), <Bug size={18} />, "metricDanger", { id: "defects:current", label: "", filter: { entity: "defect", basis: "current", activeOnly: true } }),
    metric("links", t("dashboard.linkedDefects"), snapshot.metrics.linkedDefects, t("dashboard.linkCoverageHint", { count: linkCoverage }), <Link2 size={18} />, "metricNeutral", { id: "defects:linked", label: "", filter: { entity: "defect", basis: "current", hasLink: true } }),
  ];

  return (
    <div className={`${styles.pageScroll} ${surface.page}`} aria-busy={analytics.summaryLoading}>
      <header className={surface.header}>
        <div className={surface.titleRow}>
          <div><h1>{t("dashboard.analyticsTitle")}</h1><p>{t("dashboard.analyticsDescription")}</p></div>
        </div>
        <div className={surface.filterBar}>
          <label><span>{t("dashboard.scope")}</span><AnimatedSelect compact className={surface.scopeSelect}
            label={t("dashboard.scope")} value={workspaceScope ? "workspace" : "project"}
            onChange={(value) => setWorkspaceScope(value === "workspace")} options={[
              { value: "project", label: currentProject },
              { value: "workspace", label: t("dashboard.workspaceScope") },
            ]} /></label>
          <label><span>{t("dashboard.period")}</span><AnimatedSelect compact className={surface.periodSelect}
            label={t("dashboard.period")} value={period} onChange={(value) => setPeriod(value as DashboardPeriod)}
            options={[{ value: "7d", label: t("dashboard.period7") }, { value: "30d", label: t("dashboard.period30") }, { value: "90d", label: t("dashboard.period90") }]} /></label>
          {analytics.summaryError && <span className={surface.syncError} role="alert">{t("dashboard.staleAnalytics")}</span>}
          <small>{t("dashboard.updatedAt", { date: updatedAt })}</small>
          <button type="button" className={surface.refreshButton} onClick={analytics.refresh} aria-label={t("dashboard.refresh")} title={t("dashboard.refresh")}>
            <RefreshCw className={analytics.summaryLoading ? surface.spin : undefined} size={15} />
          </button>
        </div>
      </header>

      <section className={surface.ledger} aria-label={t("dashboard.summaryAria")}>
        {metrics.map((item) => <button type="button" className={`${surface.metric} ${surface[item.tone]}`} key={item.id}
          disabled={!item.drill} onClick={() => item.drill && analytics.openDrill(item.drill)}>
          <div><span>{item.icon}</span><small>{item.label}</small></div><strong>{item.value}</strong><p>{item.hint}</p>
        </button>)}
      </section>

      <div className={surface.primaryGrid}>
        <DashboardTrendChart snapshot={snapshot} onOpenDrill={analytics.openDrill} />
        <DashboardPortfolio snapshot={snapshot} onOpenDrill={analytics.openDrill} />
      </div>
      <DashboardBreakdowns snapshot={snapshot} onOpenDrill={analytics.openDrill} />
      <DashboardOperations snapshot={snapshot} onOpenDrill={analytics.openDrill} />
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
    </div>
  );
}
