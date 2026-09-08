import { ArrowUpRight } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { metricValue } from "./model/metric-value";
import styles from "../layout.module.css";

export function MetricWidget({ metric, title, snapshot, model, openDrill }: {
  metric: string; title: string; snapshot: DashboardSnapshot | null; model: DashboardWorkbenchModel;
  openDrill: (drill: DashboardDrill) => void;
}) {
  const { t, languageTag } = useTmsLocale();
  const item = metricValue(metric, snapshot, model);
  const unavailable = item.value === undefined || item.value === null;
  return <button type="button" className={styles.metric} disabled={unavailable || (!item.kind && !item.drill)}
    onClick={() => item.kind ? model.openDrill(item.kind) : item.drill && openDrill({ ...item.drill, label: title })}>
    <span>{title}</span><strong>{unavailable ? "—" : new Intl.NumberFormat(languageTag).format(item.value!)}{!unavailable && item.percent ? "%" : ""}</strong>
    <small>{unavailable ? t("dashboardLayout.unavailableValue") : item.kind ? t("dashboardLayout.live") : t("dashboard.scope")}</small>
    <ArrowUpRight size={15} aria-hidden="true" />
  </button>;
}
