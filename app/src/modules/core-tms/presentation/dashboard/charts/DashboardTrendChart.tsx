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
import styles from "../../../tms.module.css";
import type { DashboardSnapshot } from "../model/createDashboardSnapshot";

const COLORS = {
  passRate: "#1769d2",
  failures: "#d8342f",
  defects: "#2b8a4b",
  runs: "#667786",
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
    <div className={styles.dashboardAnalyticsGrid}>
      <section className={styles.dashboardChartPanel}>
        <header className={styles.dashboardPanelHeading}>
          <div>
            <h2>{t("dashboard.qualityTrend")}</h2>
            <p>{t("dashboard.qualityTrendHint")}</p>
          </div>
        </header>
        <div className={styles.dashboardLegend} aria-hidden="true">
          <span><i style={{ background: COLORS.passRate }} />{t("dashboard.passRate")}</span>
          <span><i style={{ background: COLORS.failures }} />{t("dashboard.failures")}</span>
          <span><i style={{ background: COLORS.defects }} />{t("dashboard.openDefects")}</span>
          <span><i style={{ background: COLORS.runs }} />{t("dashboard.runsStarted")}</span>
        </div>
        <div
          className={styles.dashboardTrendChart}
          role="img"
          aria-label={t("dashboard.qualityTrendAria")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={snapshot.trend} margin={{ top: 12, right: 2, bottom: 2, left: -12 }}>
              <CartesianGrid stroke="#e6ebef" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tickFormatter={dateLabel}
                tick={{ fill: "#657687", fontSize: 11 }}
              />
              <YAxis
                yAxisId="rate"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: "#657687", fontSize: 11 }}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#657687", fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(day) => dateLabel(String(day))}
                contentStyle={{ border: "1px solid #d5dde4", borderRadius: 8, fontSize: 12 }}
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
      <section className={styles.dashboardChartPanel}>
        <header className={styles.dashboardPanelHeading}>
          <div>
            <h2>{t("dashboard.failureDistribution")}</h2>
            <p>{t("dashboard.currentResults")}</p>
          </div>
        </header>
        {hasDistribution ? (
          <div className={styles.dashboardDistributionChart} role="img" aria-label={t("dashboard.failureDistributionAria")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} layout="vertical" margin={{ top: 12, right: 34, bottom: 4, left: 4 }}>
                <CartesianGrid stroke="#edf0f2" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#657687", fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={78} axisLine={false} tickLine={false} tick={{ fill: "#475a69", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f5f7f9" }} />
                <Bar dataKey="value" name={t("dashboard.results")} radius={[0, 4, 4, 0]} isAnimationActive={!reduceMotion}>
                  {distribution.map((item) => <Cell key={item.status} fill={item.status === "failed" ? COLORS.failures : item.status === "blocked" ? "#d08a28" : "#8493a0"} />)}
                  <LabelList dataKey="value" position="right" fill="#354755" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className={styles.dashboardChartEmpty}>{t("dashboard.noFailureResults")}</p>}
      </section>
    </div>
  );
}
