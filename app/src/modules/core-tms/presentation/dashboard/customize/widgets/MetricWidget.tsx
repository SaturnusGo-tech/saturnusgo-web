import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { metricValue } from "./model/metric-value";
import { widgetByKey } from "../../../../dashboards/layout/model/widget-catalog";
import { MetricGlyph } from "./metric/MetricGlyph";
import styles from "./metric/metric.module.css";

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
  const hero = metric === "readyForRetest";
  const valueLength = value.replace(/\s/g, "").length;
  const caption = hero && !unavailable ? locale === "ru" ? "Исправления к ретесту" : "Fixes ready for retest" : context;
  const successful = ["passedRuns", "completedRuns", "passRate", "defect:verified", "defect:closed"].includes(metric);
  const danger = ["currentDefects", "reportedDefects", "defect:open", "defect:reopened"].includes(metric);
  return <button type="button" className={styles.metric} data-hero={hero} data-metric={metric}
    data-long-value={valueLength > 3} data-compact-value={valueLength > 5}
    data-tone={successful ? "success" : danger ? "danger" : "blue"} disabled={unavailable || (!item.kind && !item.drill)}
    aria-busy={hero && model.loading}
    aria-label={`${title}: ${full}. ${context}`} title={definition ? `${locale === "ru" ? definition.hintRu : definition.hintEn} · ${full}` : full}
    onClick={() => item.kind ? model.openDrill(item.kind) : item.drill && openDrill({ ...item.drill, label: title })}>
    <span className={styles.metricText}><span>{title}</span>{hero && <small>{caption}</small>}</span>
    <span className={styles.composition}>
      <strong className={styles.value} aria-hidden="true" title={full}>{value}</strong>
      <MetricGlyph metric={metric} value={item.value} />
    </span>
    <span className={styles.footer}>
      <small>{hero ? context : caption}</small>
      {hero ? <span className={styles.heroArrow}><ArrowRight size={21} aria-hidden="true" /></span>
        : <ArrowUpRight size={15} aria-hidden="true" />}
    </span>
  </button>;
}
