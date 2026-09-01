"use client";

import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardDrill, DashboardRunOutcome, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import surface from "../dashboard.module.css";

const COLORS = {
  launched: "var(--chart-4)", passed: "var(--green)", failed: "var(--red)",
  blocked: "var(--amber)", incomplete: "var(--chart-3)", not_started: "var(--line-strong)",
  aborted: "var(--muted)", passRate: "var(--chart-1)",
} as const;

export function DashboardTrendChart({
  snapshot,
  onOpenDrill,
}: {
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const reduceMotion = useReducedMotion();
  const [bucketIndex, setBucketIndex] = useState("all");
  const dateLabel = (value: string) => new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
  const launched: DashboardDrill = {
    id: "runs:launched", label: t("dashboard.launchedRuns"),
    filter: { entity: "run", basis: "launched" },
  };
  const outcomes = new Map(snapshot.runOutcomes.map((item) => [item.key, item.drill]));
  const outcomeLabel = (value: DashboardRunOutcome) => value === "incomplete"
    ? t("dashboard.incomplete")
    : value === "not_started"
      ? t("dashboard.notStarted")
      : value === "aborted" ? t("dashboard.aborted") : localizedLabel(locale, value);
  const outcomeDrill = (value: DashboardRunOutcome) => ({
    ...(outcomes.get(value) ?? {
      id: `runs:outcome:${value}`,
      filter: { entity: "run" as const, basis: "completed" as const, outcome: value },
    }),
    label: outcomeLabel(value),
  });
  const passedItems: DashboardDrill = {
    id: "items:passed", label: t("dashboard.passRate"),
    filter: { entity: "run_item", status: "passed" },
  };
  const inBucket = (drill: DashboardDrill, index: number): DashboardDrill => {
    const point = snapshot.trend[index];
    return point ? { ...drill, id: `${drill.id}:${point.start}`,
      window: { from: point.start, to: point.end } } : drill;
  };
  const selectedBucket = bucketIndex === "all" || snapshot.trend[Number(bucketIndex)]
    ? bucketIndex : "all";
  const selected = (drill: DashboardDrill) => selectedBucket === "all"
    ? drill : inBucket(drill, Number(selectedBucket));
  const hasPassRate = snapshot.trend.some((point) => point.passRate !== null);
  const controls = [
    { key: "launched", label: t("dashboard.launched"), color: COLORS.launched, drill: launched },
    ...(["passed", "failed", "blocked", "incomplete", "not_started", "aborted"] as const).map((key) => ({
      key, label: outcomeLabel(key), color: COLORS[key], drill: outcomeDrill(key),
    })),
    ...(hasPassRate
      ? [{ key: "passRate", label: t("dashboard.passRate"), color: COLORS.passRate, drill: passedItems }]
      : []),
  ];
  const hasFlow = snapshot.trend.some((point) => point.launched + point.passed + point.failed + point.blocked + point.incomplete + point.not_started + point.aborted > 0);

  return (
    <section className={`${surface.chartPanel} ${surface.flowPanel}`}>
      <header className={surface.panelHeading}>
        <div><h2>{t("dashboard.runFlow")}</h2><p>{t("dashboard.runFlowHint")}</p></div>
      </header>
      <div className={surface.chartControls} aria-label={t("dashboard.runFlowAria")}>
        {controls.map((item) => (
          <button key={item.key} type="button" onClick={() => onOpenDrill(selected(item.drill))}>
            <i style={{ background: item.color }} aria-hidden="true" />{item.label}
          </button>
        ))}
        <label className={surface.bucketPicker}><span>{t("dashboard.bucket")}</span>
          <select value={selectedBucket} onChange={(event) => setBucketIndex(event.target.value)}>
            <option value="all">{t("dashboard.wholePeriod")}</option>
            {snapshot.trend.map((point, index) => <option key={point.start} value={index}>{dateLabel(point.day)}</option>)}
          </select>
        </label>
      </div>
      {hasFlow ? (
        <div className={surface.trendChart} role="img" aria-label={t("dashboard.runFlowAria")}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={snapshot.trend} margin={{ top: 10, right: 4, bottom: 2, left: -14 }} barGap={2}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} minTickGap={30} tickFormatter={dateLabel} tick={{ fill: "var(--muted)", fontSize: 10 }} />
              <YAxis yAxisId="count" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
              {hasPassRate && <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}%`} tick={{ fill: "var(--muted)", fontSize: 10 }} />}
              <Tooltip
                labelFormatter={(value) => dateLabel(String(value))}
                contentStyle={{ color: "var(--ink)", background: "var(--control)", border: "1px solid var(--line-strong)", borderRadius: 3, fontSize: 11 }}
                labelStyle={{ color: "var(--ink)" }} itemStyle={{ color: "var(--ink)" }}
              />
              <Bar yAxisId="count" dataKey="launched" name={t("dashboard.launched")} fill={COLORS.launched} radius={[2, 2, 0, 0]} maxBarSize={10} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(launched, index))} isAnimationActive={!reduceMotion} />
              <Bar yAxisId="count" dataKey="passed" name={localizedLabel(locale, "passed")} stackId="outcomes" fill={COLORS.passed} maxBarSize={18} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(outcomeDrill("passed"), index))} isAnimationActive={!reduceMotion} />
              <Bar yAxisId="count" dataKey="failed" name={localizedLabel(locale, "failed")} stackId="outcomes" fill={COLORS.failed} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(outcomeDrill("failed"), index))} isAnimationActive={!reduceMotion} />
              <Bar yAxisId="count" dataKey="blocked" name={localizedLabel(locale, "blocked")} stackId="outcomes" fill={COLORS.blocked} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(outcomeDrill("blocked"), index))} isAnimationActive={!reduceMotion} />
              <Bar yAxisId="count" dataKey="incomplete" name={outcomeLabel("incomplete")} stackId="outcomes" fill={COLORS.incomplete} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(outcomeDrill("incomplete"), index))} isAnimationActive={!reduceMotion} />
              <Bar yAxisId="count" dataKey="not_started" name={outcomeLabel("not_started")} stackId="outcomes" fill={COLORS.not_started} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(outcomeDrill("not_started"), index))} isAnimationActive={!reduceMotion} />
              <Bar yAxisId="count" dataKey="aborted" name={outcomeLabel("aborted")} stackId="outcomes" fill={COLORS.aborted} cursor="pointer" onClick={(_, index) => onOpenDrill(inBucket(outcomeDrill("aborted"), index))} isAnimationActive={!reduceMotion} />
              {hasPassRate && <Line yAxisId="rate" dataKey="passRate" name={t("dashboard.passRate")} unit="%" type="monotone" connectNulls stroke={COLORS.passRate} strokeWidth={2} dot={false} cursor="pointer" onClick={() => onOpenDrill(selected(passedItems))} isAnimationActive={!reduceMotion} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : <p className={surface.chartEmpty}>{t("dashboard.noRunFlow")}</p>}
    </section>
  );
}
