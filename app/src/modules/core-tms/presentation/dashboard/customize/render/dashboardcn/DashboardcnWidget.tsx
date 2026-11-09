"use client";

import { DeferredPane } from "../../../../common/loading/feedback/DeferredPane";
import { ArrowUpRight, BarChart3, Play } from "lucide-react";
import type { ReactNode } from "react";
import { widgetByKey } from "../../../../../dashboards/layout/model/widget-catalog";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardSnapshot } from "../../../../../dashboards/model/dashboard-analytics";
import type { WorkbenchScope } from "../../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { DashboardViewProps } from "../../../dashboard-view";
import { metricValue } from "../../widgets/model/metric-value";
import { DashboardcnTrend } from "./trend/DashboardcnTrend";
import { DashboardcnCoverage, DashboardcnDistribution, DashboardcnPortfolio, DashboardcnTags } from "./analytics/DashboardcnAnalytics";
import { DashboardcnFreshness, DashboardcnQueue, type Workbench } from "./workbench/DashboardcnWorkbench";
import { DashboardcnCount } from "./metric/DashboardcnCount";
import { DashboardcnTriage } from "./triage/DashboardcnTriage";
import { DashboardcnSlices } from "./slices/DashboardcnSlices";
import { DefectPerformance } from "./performance/DefectPerformance";
import { DashboardcnTimeline } from "./timeline/DashboardcnTimeline";
import { DashboardCnTheme, KpiCard, TickBar } from "../../../../../../../shared/vendor/dashboardcn";
import styles from "./dashboardcn.module.css";

type Props = {
  widget: string;
  title: string;
  snapshot: DashboardSnapshot | null;
  summaryPending?: boolean;
  workbench: Workbench;
  onOpenRow?: DashboardViewProps["onOpenRow"];
  openDrill?: (drill: DashboardDrill) => void;
  readDrill?: DashboardAnalyticsSource["drill"];
  readDefectBreakdown?: DashboardAnalyticsSource["defectBreakdown"];
  workflow?: boolean;
  interactive?: boolean;
  canManageDefects?: boolean;
  projectName?: string;
  scope?: WorkbenchScope;
  onTriageChange?: () => void;
  valueContext?: string;
};

export function DashboardcnWidget(props: Props) {
  const { widget, title, snapshot, workbench, onOpenRow, openDrill, readDrill, workflow, interactive } = props;
  const { t } = useTmsLocale();
  const data = snapshot && { snapshot, title, openDrill };
  let content: ReactNode;
  switch (widget) {
    case "queue": content = workflow
      ? <DashboardcnTriage title={title} projectName={props.projectName} model={workbench} onOpenRow={onOpenRow} interactive={interactive}
          canManageDefects={props.canManageDefects} scope={props.scope} onTriageChange={props.onTriageChange} />
      : <DashboardcnQueue title={title} model={workbench} onOpenRow={onOpenRow} />; break;
    case "freshness": content = <DashboardcnFreshness title={title} model={workbench} />; break;
    case "trend": content = data && <DashboardcnTrend {...data} />; break;
    case "portfolio": content = data && <DashboardcnPortfolio {...data} />; break;
    case "tags": content = data && <DashboardcnTags {...data} />; break;
    case "coverage": content = data && <DashboardcnCoverage {...data} />; break;
    case "defects":
    case "types": content = data && (workflow
      ? <DashboardcnSlices {...data} kind={widget} readDefectBreakdown={props.readDefectBreakdown} readDrill={readDrill} onOpenRow={onOpenRow} interactive={interactive} />
      : <DashboardcnDistribution {...data} kind={widget} />); break;
    case "defectPerformance": content = data && <DefectPerformance {...data} readBreakdown={props.readDefectBreakdown} onOpenRow={onOpenRow} />; break;
    case "outcomes": content = data && <DashboardcnDistribution {...data} kind={widget} />; break;
    case "completedRuns": content = workflow ? data && <DashboardcnTimeline {...data} /> : <DashboardcnMetric {...props} />; break;
    default: content = <DashboardcnMetric {...props} />;
  }

  return <DashboardCnTheme className={styles.theme} data-dashboardcn-widget={widget}>
    {content ?? <DeferredPane pending={props.summaryPending === true} compact label={t("dashboard.summaryLoading")}>
      <section className={`${styles.card} ${styles.loading}`}>{t("dashboardLayout.unavailableValue")}</section>
    </DeferredPane>}
  </DashboardCnTheme>;
}

function DashboardcnMetric({ widget, title, snapshot, workbench, valueContext, openDrill }: Props) {
  const { t, languageTag } = useTmsLocale();
  const metric = metricValue(widget, snapshot, workbench);
  const definition = widgetByKey.get(widget);
  const value = metric.value;
  const context = value == null ? t("dashboardLayout.unavailableValue") : valueContext ?? (metric.kind ? t("dashboardLayout.live")
    : t(definition?.group === "history" ? "dashboardLayout.periodValue" : "dashboardLayout.currentValue"));
  const drill = metric.drill;
  const kind = metric.kind;
  const action = kind && workbench.openDrill ? () => workbench.openDrill?.(kind)
    : drill && openDrill ? () => openDrill({ ...drill, label: title }) : undefined;
  if (widget !== "passRate" && widget !== "runsLaunched" && widget !== "passedRuns") {
    return <DashboardcnCount title={title} value={value} locale={languageTag}
      context={context} busy={Boolean(kind && workbench.loading)} onOpen={action} />;
  }
  const full = value == null ? "—" : `${new Intl.NumberFormat(languageTag).format(value)}${metric.percent ? "%" : ""}`;
  const formatted = value != null && value >= 10000 && !metric.percent
    ? new Intl.NumberFormat(languageTag, { notation: "compact", maximumFractionDigits: 1 }).format(value) : full;
  const trend = widget === "runsLaunched" ? snapshot?.trend.map(point => point.launched)
    : widget === "passedRuns" ? snapshot?.trend.map(point => point.passed) : undefined;
  const Icon = widget === "passRate" ? BarChart3 : Play;
  return <div className={styles.metric} data-interactive={value != null && Boolean(action)}>
    <KpiCard label={title} value={formatted} trend={trend} icon={<Icon size={14} aria-hidden="true" />}
      deltaLabel={context} aria-busy={Boolean(kind && workbench.loading)} className={styles.kpi}>
      {metric.percent && value != null && <TickBar value={value} segments={20} animate={false}
        color="var(--dash-success)" className={styles.kpiMeter} aria-hidden="true" />}
    </KpiCard>
    {value != null && action && <button className={styles.metricAction} type="button" title={`${title} · ${full}`}
      aria-label={`${title}: ${full}. ${context}`} onClick={action}><ArrowUpRight size={15} aria-hidden="true" /></button>}
  </div>;
}
