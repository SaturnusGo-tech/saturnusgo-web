import { ArrowUpRight } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { metricValue } from "./model/metric-value";
import { widgetByKey } from "../../../../dashboards/layout/model/widget-catalog";
import styles from "../layout.module.css";

export function MetricWidget({ metric, title, snapshot, model, openDrill }: {
  metric: string; title: string; snapshot: DashboardSnapshot | null; model: DashboardWorkbenchModel;
  openDrill: (drill: DashboardDrill) => void;
}) {
  const { t, locale, languageTag } = useTmsLocale();
  const item = metricValue(metric, snapshot, model);
  const unavailable = item.value === undefined || item.value === null;
  const definition = widgetByKey.get(metric);
  const suffix = !unavailable && item.percent ? "%" : "";
  const full = unavailable ? "—" : new Intl.NumberFormat(languageTag).format(item.value!) + suffix;
  const value = !unavailable && item.value! >= 10000
    ? new Intl.NumberFormat(languageTag, { notation: "compact", maximumFractionDigits: 1 }).format(item.value!) + suffix : full;
  const context = unavailable ? t("dashboardLayout.unavailableValue") : item.kind ? t("dashboardLayout.live")
    : t(definition?.group === "history" ? "dashboardLayout.periodValue" : "dashboardLayout.currentValue");
  return <button type="button" className={styles.metric} disabled={unavailable || (!item.kind && !item.drill)}
    aria-label={`${title}: ${full}. ${context}`} title={definition ? `${locale === "ru" ? definition.hintRu : definition.hintEn} · ${full}` : full}
    onClick={() => item.kind ? model.openDrill(item.kind) : item.drill && openDrill({ ...item.drill, label: title })}>
    <span className={styles.metricText}><span>{title}</span><small>{context}</small></span>
    <strong aria-hidden="true">{value}</strong>
    <ArrowUpRight size={15} aria-hidden="true" />
  </button>;
}
