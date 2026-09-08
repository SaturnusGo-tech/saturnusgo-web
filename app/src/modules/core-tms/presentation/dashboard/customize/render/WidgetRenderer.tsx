import { LoaderCircle } from "lucide-react";
import { widgetByKey } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DashboardViewProps } from "../../dashboard-view";
import type { DashboardModel } from "../model/useDashboardModel";
import { DashboardTrendChart } from "../../charts/DashboardTrendChart";
import { DashboardBreakdowns } from "../../charts/DashboardBreakdowns";
import { DashboardPortfolio } from "../../sections/DashboardPortfolio";
import { DashboardOperations } from "../../sections/DashboardOperations";
import { FreshnessPanel } from "../../workbench/FreshnessPanel";
import { WorkbenchPanel } from "../../workbench/WorkbenchPanel";
import { MetricWidget } from "../widgets/MetricWidget";
import { OutcomeWidget } from "../widgets/OutcomeWidget";
import styles from "../layout.module.css";
export function WidgetRenderer({ widget, title, model, onOpenRow }: {
  widget: string; title?: string; model: DashboardModel; onOpenRow: DashboardViewProps["onOpenRow"];
}) {
  const { locale, t } = useTmsLocale(); const { snapshot, analytics, workbench, preferences } = model;
  const definition = widgetByKey.get(widget);
  if (!definition) return <p className={styles.unavailable}>{t("dashboardLayout.unknown")}</p>;
  if (definition.width === 3 || widget === "readyForRetest") return <MetricWidget metric={widget}
    title={title ?? (locale === "ru" ? definition.ru : definition.en)} snapshot={snapshot} model={workbench} openDrill={analytics.openDrill} />;
  if (widget === "queue") return <WorkbenchPanel model={workbench} onOpenRow={onOpenRow} />;
  if (widget === "freshness") return <FreshnessPanel model={workbench} page={preferences.value.freshnessPage} onPageChange={freshnessPage => preferences.update({ freshnessPage })} />;
  if (!snapshot) return <div className={styles.unavailable} role="status"><LoaderCircle size={18} />{t("dashboard.summaryLoading")}</div>;
  if (widget === "trend") return <DashboardTrendChart snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
  if (widget === "portfolio") return <DashboardPortfolio snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
  if (widget === "defects") return <DashboardOperations snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
  if (widget === "outcomes") return <OutcomeWidget snapshot={snapshot} openDrill={analytics.openDrill} />;
  if (widget === "types" || widget === "tags" || widget === "coverage") return <DashboardBreakdowns kind={widget} snapshot={snapshot} onOpenDrill={analytics.openDrill} />;
  return null;
}
