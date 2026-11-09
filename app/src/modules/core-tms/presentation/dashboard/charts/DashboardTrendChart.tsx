"use client";

import { useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Dot, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardDrill, DashboardPeriod, DashboardRunOutcome, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { DashboardChartTooltip } from "../common/DashboardChartTooltip";
import { DashboardSegments, dashboardTabId } from "../common/segments/DashboardSegments";
import { DashboardSelect } from "../common/select/DashboardSelect";
import controlStyles from "./controls/trend-controls.module.css";
import styles from "./trend.module.css";

const SERIES = ["launched", "passed", "failed", "blocked", "incomplete", "not_started", "aborted"] as const;
type SeriesKey = typeof SERIES[number];


export function DashboardTrendChart({ snapshot, onOpenDrill, onPeriodChange }: {
  snapshot: DashboardSnapshot;
  onOpenDrill?: (drill: DashboardDrill) => void;
  onPeriodChange?: (period: DashboardPeriod) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelId = `${titleId}-chart`;
  const [mode, setMode] = useState<"launched" | "outcomes">("launched");
  const [bucket, setBucket] = useState("all");
  const [hidden, setHidden] = useState<SeriesKey[]>([]);
  const dateFormat = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", timeZone: "UTC" });
  const numberFormat = new Intl.NumberFormat(languageTag);
  const dateLabel = (value: string) => dateFormat.format(new Date(`${value}T00:00:00.000Z`));
  const bucketLabel = (start: string, end: string) => {
    const first = new Date(start);
    const last = new Date(Math.max(Date.parse(end) - 1, Date.parse(start)));
    return last.getTime() - first.getTime() < 36 * 60 * 60 * 1000
      ? dateFormat.format(first) : `${dateFormat.format(first)} — ${dateFormat.format(last)}`;
  };
  const outcomeLabel = (value: DashboardRunOutcome) => value === "incomplete" ? t("dashboard.incomplete")
    : value === "not_started" ? t("dashboard.notStarted")
      : value === "aborted" ? t("dashboard.aborted") : localizedLabel(locale, value);
  const launched: DashboardDrill = { id: "runs:launched", label: t("dashboard.launchedRuns"),
    filter: { entity: "run", basis: "launched" } };
  const outcomeDrill = (value: DashboardRunOutcome): DashboardDrill => ({
    ...(snapshot.runOutcomes.find((item) => item.key === value)?.drill ?? {
      id: `runs:outcome:${value}`, filter: { entity: "run", basis: "completed", outcome: value },
    }), label: outcomeLabel(value),
  });
  const inBucket = (drill: DashboardDrill, index: number): DashboardDrill => {
    const point = snapshot.trend[index];
    return point ? { ...drill, id: `${drill.id}:${point.start}`, window: { from: point.start, to: point.end } } : drill;
  };
  const selectedIndex = snapshot.trend.findIndex((point) => point.start === bucket);
  const selectedPoint = snapshot.trend[selectedIndex];
  const selected = (drill: DashboardDrill) => inBucket(drill, selectedIndex);
  const bucketOptions = [{ value: "all", label: t("dashboard.wholePeriod") }, ...snapshot.trend.map((point) => ({
    value: point.start, label: bucketLabel(point.start, point.end),
  }))];
  const controls = SERIES.map((key) => ({ key, label: key === "launched" ? t("dashboard.launched") : outcomeLabel(key),
    drill: key === "launched" ? launched : outcomeDrill(key), color: `var(--trend-${key})`,
    value: selectedPoint ? selectedPoint[key] : snapshot.trend.reduce((total, point) => total + point[key], 0),
  }));
  const shownControls = controls.filter((item) => mode === "launched" ? item.key === "launched" : item.key !== "launched");
  const hasFlow = snapshot.trend.some((point) => shownControls.some(({ key }) => point[key] > 0));
  const toggle = (key: SeriesKey) => setHidden((current) => current.includes(key)
    ? current.filter((value) => value !== key) : shownControls.some((item) => item.key !== key && !current.includes(item.key)) ? [...current, key] : current);

  return (
    <section className={styles.panel} aria-labelledby={titleId} aria-description={t("dashboard.runFlowHint")}>
      <header className={styles.heading}>
        <div><h2 id={titleId}>{t("dashboard.runFlow")}</h2><p>{t(mode === "launched" ? "dashboard.launchTrendHint" : "dashboard.outcomeTrendHint")}</p></div>
        {onPeriodChange && <DashboardSelect label={t("dashboard.historyPeriod")}
          value={snapshot.query.period} onChange={(value) => onPeriodChange(value as DashboardPeriod)} options={[
            { value: "7d", label: t("dashboard.period7") }, { value: "30d", label: t("dashboard.period30") },
            { value: "90d", label: t("dashboard.period90") },
          ]} />}
      </header>
      <DashboardSegments label={t("dashboard.runFlow")} panelId={panelId} selectedKey={mode} listClassName={`${styles.modes} ${controlStyles.segments}`}
        items={[{ key: "launched", label: t("dashboard.launchTrend") }, { key: "outcomes", label: t("dashboard.outcomeTrend") }]}
        onSelect={(next) => { setMode(next); setHidden([]); }} />
      <div id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, mode)}>
        {hasFlow ? <>
          <div className={styles.axisLabel}>{t("dashboard.runCount")}</div>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={snapshot.trend} margin={{ top: 8, right: 20, bottom: 4, left: 0 }}
                accessibilityLayer aria-label={t("dashboard.runFlowAria")}>
                <CartesianGrid stroke="var(--trend-grid)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} minTickGap={36} tickMargin={12}
                  tickFormatter={dateLabel} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis width={42} allowDecimals={false} domain={[0, "auto"]} includeHidden axisLine={false}
                  tickLine={false} tickMargin={10} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
                  content={<DashboardChartTooltip formatLabel={(value) => { const point = snapshot.trend.find((item) => item.day === value); return point ? bucketLabel(point.start, point.end) : dateLabel(String(value)); }}
                    formatValue={(value) => numberFormat.format(Number(value))} />} />
                {mode === "launched" && <Area dataKey="launched" name={t("dashboard.launchedRuns")} type="monotone" hide={hidden.includes("launched")}
                  stroke="var(--trend-launched)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="var(--trend-launched)" fillOpacity={0.055}
                  dot={snapshot.trend.length === 1 ? { r: 3 } : false} connectNulls={false}
                  activeDot={(point) => <Dot {...point} r={4} cursor={onOpenDrill ? "pointer" : undefined} onClick={onOpenDrill && (() => onOpenDrill(inBucket(launched, point.index)))} />}
                  isAnimationActive={reduceMotion === false} animationDuration={300} />}
                {shownControls.filter((item) => item.key !== "launched").map((item) => (
                  <Line key={item.key} dataKey={item.key} name={item.label} type="monotone" hide={hidden.includes(item.key)}
                    stroke={item.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" connectNulls={false}
                    dot={snapshot.trend.length === 1 ? { r: 3 } : false}
                    activeDot={(point) => <Dot {...point} r={4} cursor={onOpenDrill ? "pointer" : undefined} onClick={onOpenDrill && (() => onOpenDrill(inBucket(item.drill, point.index)))} />}
                    isAnimationActive={reduceMotion === false} animationDuration={300} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </> : <p className={styles.empty}>{t("dashboard.noRunFlow")}</p>}
        <div className={styles.legend} role="group" aria-label={t("dashboard.runFlowAria")}>
          {shownControls.map((item) => {
            const visible = !hidden.includes(item.key);
            return <div className={styles.series} key={item.key} data-visible={visible}>
              <button className={styles.toggle} type="button" aria-pressed={visible} onClick={() => toggle(item.key)}
                disabled={visible && shownControls.filter((item) => !hidden.includes(item.key)).length === 1}
                aria-label={`${t(visible ? "dashboard.hideSeries" : "dashboard.showSeries")}: ${item.label}`}>
                <span className={styles.dot} aria-hidden="true" style={{ background: item.color }} />
                <span>{item.label}</span>
              </button>
              {onOpenDrill ? <button className={styles.drill} type="button" onClick={() => onOpenDrill(selected(item.drill))}
                aria-label={`${t("dashboard.open.run")}: ${item.label}, ${numberFormat.format(item.value)}`}>
                <strong>{numberFormat.format(item.value)}</strong><ArrowUpRight size={12} aria-hidden="true" />
              </button> : <span className={styles.drill}><strong>{numberFormat.format(item.value)}</strong></span>}
            </div>;
          })}
        </div>
        <footer className={styles.footer}>
          <DashboardSelect label={t("dashboard.bucket")}
            value={selectedPoint ? bucket : "all"} onChange={setBucket} options={bucketOptions} />
        </footer>
      </div>
    </section>
  );
}
