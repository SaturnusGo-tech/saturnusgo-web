"use client";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { DashboardPeriod } from "../../../dashboards/model/dashboard-analytics";
import { createHttpDashboardAnalyticsSource } from "../../../dashboards/source/http-dashboard-analytics-source";
import { useDashboardWorkbench } from "../../../dashboards/workbench/application/useDashboardWorkbench";
import type { DashboardLayoutModel } from "../../../dashboards/layout/application/useDashboardLayout";
import type { DashboardViewProps } from "../dashboard-view";
import { widgetByKey, widgetKey } from "../../../dashboards/layout/model/widget-catalog";
import { useDashboardAnalytics } from "../controller/useDashboardAnalytics";
import { DashboardTrendChart } from "../charts/DashboardTrendChart";
import { DashboardBreakdowns } from "../charts/DashboardBreakdowns";
import { DashboardPortfolio } from "../sections/DashboardPortfolio";
import { DashboardOperations } from "../sections/DashboardOperations";
import { DashboardDrillInspector } from "../inspector/DashboardDrillInspector";
import { FreshnessPanel } from "../workbench/FreshnessPanel";
import { WorkbenchPanel } from "../workbench/WorkbenchPanel";
import { WorkbenchContextBar } from "../workbench/controls/WorkbenchContextBar";
import { WorkbenchDrillInspector } from "../workbench/inspector/WorkbenchDrillInspector";
import { WidgetGrid } from "./grid/WidgetGrid";
import { MetricWidget } from "./widgets/MetricWidget";
import { OutcomeWidget } from "./widgets/OutcomeWidget";
import surface from "../dashboard.module.css";
import styles from "./layout.module.css";

export function DashboardContent({ data, projectId, onOpenEntity, onOpenRow,
  onCreateRun, serverAnalytics = false, analyticsSource, layout }: DashboardViewProps & { layout: DashboardLayoutModel }) {
  const { languageTag, t } = useTmsLocale();
  const http = useTmsHttpClient();
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const scope = useMemo(() => ({ workspaceId: data.workspace.id,
    projectId,
  }), [data.workspace.id, projectId]);
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


  const [filtersOpen, setFiltersOpen] = useState(false);
  const reduced = useReducedMotion();
  const widgets = (layout.draft ?? layout.board)?.widgets ?? [];
  const editing = Boolean(layout.draft);
  return <>
    <div className={styles.context}>
      <button type="button" className={styles.quiet} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>{t("dashboardWorkbench.context")}</button>
      <AnimatedSelect compact className={styles.period} label={t("dashboard.period")} value={period} onChange={(value) => setPeriod(value as DashboardPeriod)}
        options={[{value:"7d",label:t("dashboard.period7")},{value:"30d",label:t("dashboard.period30")},{value:"90d",label:t("dashboard.period90")}]} />
      <button type="button" className={surface.refreshButton} aria-label={t("dashboard.refresh")}
        onClick={() => { analytics.refresh(); workbench.refresh(); }}><RefreshCw size={15} /></button></div>
    <AnimatePresence initial={false}>{filtersOpen && <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:reduced ? 0 : .2}} style={{position:"relative",zIndex:30,overflow:"visible",display:"flow-root"}}><WorkbenchContextBar model={workbench} /></motion.div>}</AnimatePresence>
    {analytics.summaryError && <p className={surface.syncError} role="alert">{t(snapshot ? "dashboard.staleAnalytics" : "dashboard.summaryError")}
      <button onClick={analytics.refresh}>{t("dashboard.retry")}</button></p>}
    <WidgetGrid widgets={widgets} editing={editing} disabled={layout.saving || layout.retryPending || layout.failure === "conflict"}
      onMove={layout.controller.move} onRemove={layout.controller.remove} onResize={layout.controller.resize}
      render={(widget,title) => {
        const key = widgetKey(widget); const definition = widgetByKey.get(key);
        if (!definition) return <p className={styles.unavailable}>{t("dashboardLayout.unknown")}</p>;
        if (definition.width === 3) return <MetricWidget metric={key} title={title} snapshot={snapshot} model={workbench} openDrill={analytics.openDrill} />;
        if (key === "queue") return <WorkbenchPanel model={workbench} onOpenRow={onOpenRow} />;
        if (key === "freshness") return <FreshnessPanel model={workbench} />;
        if (!snapshot) return <div className={styles.unavailable} role="status"><LoaderCircle size={18} />{t("dashboard.summaryLoading")}</div>;
        if (key === "trend") return <DashboardTrendChart snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
        if (key === "portfolio") return <DashboardPortfolio snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
        if (key === "defects") return <DashboardOperations snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
        if (key === "outcomes") return <OutcomeWidget snapshot={snapshot} openDrill={analytics.openDrill} />;
        if (key === "types" || key === "tags" || key === "coverage") return <DashboardBreakdowns kind={key} snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
        return null;
      }} />
    {updatedAt && <p className={surface.updatedAt}>{t("dashboard.historicalUpdated", { date: updatedAt })}</p>}
    <WorkbenchDrillInspector model={workbench} onOpenRow={onOpenRow} />
    {analytics.drill.selected && analytics.drill.origin && <DashboardDrillInspector
      query={query} origin={analytics.drill.origin} selected={analytics.drill.selected} page={analytics.drill.page}
      loading={analytics.drill.loading} error={analytics.drill.error}
      scopeLabel={analytics.drill.origin.projectId
        ? data.projects.find((item) => item.id === analytics.drill.origin?.projectId)?.name ?? currentProject
        : currentProject}
      onSelectDrill={analytics.selectRelatedDrill} onOpenEntity={onOpenEntity}
      onOpenRow={onOpenRow} onCreateRun={onCreateRun}
      onClose={analytics.closeDrill} onRetry={analytics.retryDrill} onLoadMore={analytics.loadMore}
    />}
  </>;
}
