import { ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";
import type { DashboardDrill, DashboardRunOutcome, DashboardSnapshot, DashboardTrendPoint } from "../../../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../localization/format/labels";
import { OUTCOME_COLORS } from "../../../../charts/model/breakdown-data";
import { DashboardSelect } from "../../../../common/select/DashboardSelect";
import controls from "../../../../charts/controls/trend-controls.module.css";
import { DashboardSegments, dashboardTabId } from "../../../../common/segments/DashboardSegments";
import { WidgetAction, WidgetCard } from "../card/WidgetCard";
import { TrendChart } from "../../../../../../../../shared/vendor/dashboardcn";
import styles from "../dashboardcn.module.css";

const OUTCOMES = ["passed", "failed", "blocked", "incomplete", "not_started", "aborted"] as const;
type SeriesKey = "launched" | DashboardRunOutcome;

export function DashboardcnTrend({ title, snapshot, openDrill }: {
  title: string; snapshot: DashboardSnapshot; openDrill?: (drill: DashboardDrill) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const panelId = useId();
  const [mode, setMode] = useState<"launched" | "outcomes">("launched");
  const [bucket, setBucket] = useState("all");
  const [hidden, setHidden] = useState<SeriesKey[]>([]);
  const dates = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", timeZone: "UTC" });
  const numbers = new Intl.NumberFormat(languageTag);
  const selectedPoint = snapshot.trend.find(point => point.start === bucket);
  const dateLabel = (value: unknown) => {
    if (typeof value !== "string") return "";
    const day = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(day.getTime()) ? value : dates.format(day);
  };
  const bucketLabel = ({ start, end }: DashboardTrendPoint) => {
    const first = new Date(start);
    const last = new Date(Math.max(Date.parse(end) - 1, Date.parse(start)));
    return last.getTime() - first.getTime() < 36 * 60 * 60 * 1000
      ? dates.format(first) : `${dates.format(first)} — ${dates.format(last)}`;
  };
  const labelFor = (key: SeriesKey) => key === "launched" ? t("dashboard.launched")
    : key === "incomplete" ? t("dashboard.incomplete") : key === "not_started" ? t("dashboard.notStarted")
      : key === "aborted" ? t("dashboard.aborted") : localizedLabel(locale, key);
  const keys: readonly SeriesKey[] = mode === "launched" ? ["launched"] : OUTCOMES;
  const shown = keys.map(key => ({
    key, label: labelFor(key), color: OUTCOME_COLORS[key] ?? "var(--dash-blue)",
    value: selectedPoint?.[key] ?? snapshot.trend.reduce((sum, point) => sum + point[key], 0),
  }));
  const active = shown.filter(item => !hidden.includes(item.key));
  const hasFlow = snapshot.trend.some(point => shown.some(({ key }) => point[key] > 0));
  const launched = mode === "launched" ? shown[0] : undefined;
  const drill = (key: SeriesKey, point: DashboardTrendPoint | undefined) => {
    const original: DashboardDrill = key === "launched" ? { id: "runs:launched", label: t("dashboard.launchedRuns"), filter: { entity: "run", basis: "launched" } }
      : snapshot.runOutcomes.find(item => item.key === key)?.drill ?? { id: `runs:outcome:${key}`, label: labelFor(key), filter: { entity: "run", basis: "completed", outcome: key } };
    const filtered = point ? { ...original, id: `${original.id}:${point.start}`, window: { from: point.start, to: point.end } } : original;
    openDrill?.({ ...filtered, label: labelFor(key) });
  };
  const toggle = (key: SeriesKey) => setHidden(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]);
  return <WidgetCard heading={title} className={styles.trendCard}
    subtitle={t(mode === "launched" ? "dashboard.launchTrendHint" : "dashboard.outcomeTrendHint")}
    actions={<div className={styles.trendActions}>
      <DashboardSelect label={t("dashboard.bucket")} value={selectedPoint ? bucket : "all"}
        onChange={setBucket} options={[{ value: "all", label: t("dashboard.wholePeriod") }, ...snapshot.trend.map(point => ({
          value: point.start, label: bucketLabel(point),
        }))]} />
      {launched && <WidgetAction className={styles.launchedTotal} onClick={openDrill && (() => drill("launched", selectedPoint))}
        aria-label={`${t("dashboard.open.run")}: ${launched.label}, ${numbers.format(launched.value)}`}>
        <span>{launched.label}</span><strong>{numbers.format(launched.value)}</strong>
        {openDrill && <ArrowUpRight size={12} aria-hidden="true" />}
      </WidgetAction>}
    </div>}>
    <DashboardSegments label={title} panelId={panelId} selectedKey={mode} listClassName={controls.segments}
      items={[{ key: "launched", label: t("dashboard.launchTrend") }, { key: "outcomes", label: t("dashboard.outcomeTrend") }]}
      onSelect={next => { setMode(next); setHidden([]); }} />
    <div className={styles.trend} id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, mode)}>
      {hasFlow ? <TrendChart className={styles.chart} type={mode === "launched" ? "area" : "line"} data={snapshot.trend} xKey="day"
        series={active} animate={false} showLegend={false} showYAxis showGrid allowDecimals={false} xFormatter={dateLabel} yFormatter={numbers.format}
        aria-label={t("dashboard.runFlowAria")} labelFormatter={value => {
          const point = snapshot.trend.find(item => item.day === value);
          return point ? bucketLabel(point) : dateLabel(value);
        }} onPointSelect={openDrill && ((key, index) => drill(key as SeriesKey, snapshot.trend[index]))} />
        : <p className={styles.empty}>{t("dashboard.noRunFlow")}</p>}
      {mode === "outcomes" && <ul className={styles.series}>{shown.map(item => {
        const visible = !hidden.includes(item.key);
        return <li key={item.key} data-visible={visible}>
          <button className={styles.action} type="button" aria-pressed={visible} disabled={visible && active.length === 1}
            onClick={() => toggle(item.key)} aria-label={`${t(visible ? "dashboard.hideSeries" : "dashboard.showSeries")}: ${item.label}`}>
            <i aria-hidden="true" style={{ background: item.color }} /><span>{item.label}</span>
          </button>
          <WidgetAction className={styles.seriesValue} onClick={openDrill && (() => drill(item.key, selectedPoint))}
            aria-label={`${t("dashboard.open.run")}: ${item.label}, ${numbers.format(item.value)}`}>
            <strong>{numbers.format(item.value)}</strong>{openDrill && <ArrowUpRight size={12} aria-hidden="true" />}
          </WidgetAction>
        </li>;
      })}</ul>}
    </div>
  </WidgetCard>;
}
