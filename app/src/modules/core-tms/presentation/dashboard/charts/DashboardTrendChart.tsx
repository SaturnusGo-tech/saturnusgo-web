"use client";

import { useReducedMotion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import surface from "../dashboard.module.css";
import type { DashboardSnapshot } from "../model/createDashboardSnapshot";

const COLORS = {
  passRate: "var(--chart-1)",
  failures: "var(--chart-2)",
  defects: "var(--chart-3)",
  runs: "var(--chart-4)",
};

export function DashboardTrendChart({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { locale, languageTag, t } = useTmsLocale();
  const reduceMotion = useReducedMotion();
  const dateLabel = (day: string) => new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00.000Z`));
  const distribution = snapshot.distribution.map((item) => ({
    ...item,
    label: localizedLabel(locale, item.status),
  }));
  const hasDistribution = distribution.some((item) => item.value > 0);

  return (
    <div className={surface.analyticsGrid}>
      <section className={surface.chartPanel}>
        <header className={surface.panelHeading}>
          <div>
            <h2>{t("dashboard.qualityTrend")}</h2>
            <p>{t("dashboard.qualityTrendHint")}</p>
          </div>
        </header>
        <div className={surface.legend} aria-hidden="true">
          <span><i style={{ background: COLORS.passRate }} />{t("dashboard.passRate")}</span>
          <span><i style={{ background: COLORS.failures }} />{t("dashboard.failures")}</span>
          <span><i style={{ background: COLORS.defects }} />{t("dashboard.openDefects")}</span>
          <span><i style={{ background: COLORS.runs }} />{t("dashboard.runsStarted")}</span>
        </div>
        <div
          className={surface.trendChart}
          role="img"
          aria-label={t("dashboard.qualityTrendAria")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={snapshot.trend} margin={{ top: 12, right: 2, bottom: 2, left: -12 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tickFormatter={dateLabel}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <YAxis
                yAxisId="rate"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(day) => dateLabel(String(day))}
                contentStyle={{ color: "var(--ink)", background: "var(--control)", border: "1px solid var(--line-strong)", borderRadius: 4, fontSize: 12 }}
                labelStyle={{ color: "var(--ink)" }}
                itemStyle={{ color: "var(--ink)" }}
              />
              <Area
                yAxisId="rate"
                dataKey="passRate"
                name={t("dashboard.passRate")}
                unit="%"
                type="monotone"
                stroke={COLORS.passRate}
                fill={COLORS.passRate}
                fillOpacity={0.08}
                strokeWidth={2}
                connectNulls
                isAnimationActive={!reduceMotion}
              />
              <Line yAxisId="count" dataKey="failures" name={t("dashboard.failures")} stroke={COLORS.failures} strokeWidth={2} dot={false} isAnimationActive={!reduceMotion} />
              <Line yAxisId="count" dataKey="defects" name={t("dashboard.openDefects")} stroke={COLORS.defects} strokeWidth={2} dot={false} isAnimationActive={!reduceMotion} />
              <Line yAxisId="count" dataKey="runs" name={t("dashboard.runsStarted")} stroke={COLORS.runs} strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={!reduceMotion} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className={surface.chartPanel}>
        <header className={surface.panelHeading}>
          <div>
            <h2>{t("dashboard.failureDistribution")}</h2>
            <p>{t("dashboard.currentResults")}</p>
          </div>
        </header>
        {hasDistribution ? (
          <div className={surface.distributionChart} role="img" aria-label={t("dashboard.failureDistributionAria")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} layout="vertical" margin={{ top: 12, right: 34, bottom: 4, left: 4 }}>
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={78} axisLine={false} tickLine={false} tick={{ fill: "var(--ink)", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "var(--control-hover)" }}
                  contentStyle={{ color: "var(--ink)", background: "var(--control)", border: "1px solid var(--line-strong)", borderRadius: 4, fontSize: 12 }}
                  labelStyle={{ color: "var(--ink)" }}
                  itemStyle={{ color: "var(--ink)" }}
                />
                <Bar dataKey="value" name={t("dashboard.results")} radius={[0, 4, 4, 0]} isAnimationActive={!reduceMotion}>
                  {distribution.map((item) => <Cell key={item.status} fill={item.status === "failed" ? COLORS.failures : item.status === "blocked" ? "var(--amber)" : "var(--muted)"} />)}
                  <LabelList dataKey="value" position="right" fill="var(--ink)" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className={surface.chartEmpty}>{t("dashboard.noFailureResults")}</p>}
      </section>
    </div>
  );
}
