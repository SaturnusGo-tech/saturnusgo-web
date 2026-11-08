"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { widgetByKey } from "../../../../dashboards/layout/model/widget-catalog";
import type { DashboardSnapshot } from "../../../../dashboards/model/dashboard-analytics";
import type { WorkbenchSnapshot } from "../../../../dashboards/workbench/model/workbench";
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

type WidgetProps = { widget: string; title?: string };
type Props = WidgetProps & (
  | { model: DashboardModel; onOpenRow: DashboardViewProps["onOpenRow"] }
  | { evidence: { snapshot: DashboardSnapshot | null; workbench: WorkbenchSnapshot | null; valueContext: string } }
);

export function WidgetRenderer(props: Props) {
  const { widget, title } = props;
  const { locale, t } = useTmsLocale();
  const [tab, selectTab] = useState<"activeRuns" | "readyForRetest">("activeRuns");
  const definition = widgetByKey.get(widget);
  const model = "model" in props ? props.model : undefined;
  const evidence = "evidence" in props ? props.evidence : undefined;
  const snapshot = model?.snapshot ?? evidence?.snapshot ?? null;
  const openDrill = model?.analytics.openDrill;
  const workbench = model?.workbench ?? {
    snapshot: evidence?.workbench ?? null, tab, selectTab,
    loading: false, enabled: true, error: null, refresh: async () => undefined,
  };

  if (!definition) return <p className={styles.unavailable}>{t("dashboardLayout.unknown")}</p>;
  if (definition.width === 3 || widget === "readyForRetest") return <MetricWidget metric={widget}
    title={title ?? (locale === "ru" ? definition.ru : definition.en)} snapshot={snapshot} model={workbench}
    openDrill={openDrill} valueContext={evidence?.valueContext} />;
  if (widget === "queue") return <WorkbenchPanel model={workbench} onOpenRow={"onOpenRow" in props ? props.onOpenRow : undefined} />;
  if (widget === "freshness") return <FreshnessPanel model={workbench} page={model?.preferences.value.freshnessPage}
    onPageChange={model && (freshnessPage => model.preferences.update({ freshnessPage: freshnessPage === 1 ? 1 : 0 }))} />;
  if (!snapshot) return <div className={styles.unavailable} role="status"><LoaderCircle size={18} />{t("dashboard.summaryLoading")}</div>;
  if (widget === "trend") return <DashboardTrendChart snapshot={snapshot} onOpenDrill={openDrill} />;
  if (widget === "portfolio") return <DashboardPortfolio snapshot={snapshot} onOpenDrill={openDrill} />;
  if (widget === "defects") return <DashboardOperations snapshot={snapshot} onOpenDrill={openDrill} />;
  if (widget === "outcomes") return <OutcomeWidget snapshot={snapshot} openDrill={openDrill} />;
  if (widget === "types" || widget === "tags" || widget === "coverage") return <DashboardBreakdowns kind={widget} snapshot={snapshot} onOpenDrill={openDrill} />;
  return null;
}
