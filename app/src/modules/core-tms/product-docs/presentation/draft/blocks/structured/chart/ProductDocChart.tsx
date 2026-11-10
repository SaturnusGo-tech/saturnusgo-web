"use client";

import { useId, useMemo } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../localization/format/labels";
import { chartPriorities, parseProductDocChart, positionChartPoints, type ChartPoint } from "./model/product-doc-chart";
import styles from "./product-doc-chart.module.css";

type PointShape = { cx: number; cy: number; payload: ChartPoint };

export function ProductDocChart({ source, openInNewTab = false }: { source: string; openInNewTab?: boolean }) {
  const { locale, languageTag } = useTmsLocale();
  const id = useId();
  const chart = useMemo(() => parseProductDocChart(source), [source]);
  const points = useMemo(() => chart ? positionChartPoints(chart.points) : [], [chart]);
  const format = useMemo(() => new Intl.NumberFormat(languageTag, { maximumFractionDigits: 2 }), [languageTag]);
  const ru = locale === "ru";
  const dayUnit = ru ? "дн." : "d";
  const formatDays = (value: number) => `${value > 0 && value < .01 ? `< ${format.format(.01)}` : format.format(value)} ${dayUnit}`;
  const priorityLabel = (priority: ChartPoint["priority"]) => localizedLabel(locale, priority);

  if (!chart) return <p className={styles.state} role="status">{ru ? "Некорректные данные графика." : "Invalid chart data."}</p>;

  return <figure className={styles.figure} aria-labelledby={id} data-product-doc-chart={chart.kind}>
    <figcaption id={id} className={styles.caption}>
      <strong>{chart.title}</strong>
      {points.length > 0 && <span>{ru ? "Наблюдений" : "Observations"} · {format.format(points.length)}</span>}
    </figcaption>
    {points.length === 0 ? <p className={styles.state}>{ru ? "Нет данных о закрытых дефектах." : "No resolved defects to plot."}</p>
      : <div className={styles.plot}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ScatterChart margin={{ top: 12, bottom: 3, left: 8, right: 10 }}>
            <CartesianGrid vertical={false} stroke="var(--falcon-border)" strokeDasharray="3 4" />
            <XAxis type="number" dataKey="position" domain={[-.5, 3.5]} ticks={[0, 1, 2, 3]}
              stroke="var(--falcon-border)" height={32} tickLine={false} tickMargin={9}
              tick={{ fill: "var(--falcon-text-secondary)", fontSize: 11 }}
              tickFormatter={value => chartPriorities[value] ? priorityLabel(chartPriorities[value]) : ""} />
            <YAxis type="number" dataKey="days" domain={[0, (maximum: number) => Math.max(1, maximum)]} orientation="right"
              axisLine={false} tickLine={false} tickMargin={8} width={57}
              tick={{ fill: "var(--falcon-text-secondary)", fontSize: 11 }} tickFormatter={formatDays} />
            <Tooltip cursor={false} isAnimationActive={false} content={({ active, payload }) => {
              const point = payload[0]?.payload as ChartPoint | undefined;
              return active && point ? <div className={styles.tooltip}>
                <strong>{point.label}</strong><span>{priorityLabel(point.priority)} · {formatDays(point.days)}</span>
              </div> : null;
            }} />
            <Scatter data={points} isAnimationActive={false} shape={input => {
              const { cx, cy, payload } = input as PointShape;
              const label = `${payload.label} · ${priorityLabel(payload.priority)} · ${formatDays(payload.days)}`;
              const marker = <>
                <circle cx={cx} cy={cy} r={9} fill="transparent" />
                <circle cx={cx} cy={cy} r={3.5} fill="var(--chart-point)" className={styles.dot} />
              </>;
              return payload.href ? <a className={styles.point} href={payload.href} aria-label={label}
                data-priority={payload.priority} target={openInNewTab ? "_blank" : undefined} rel={openInNewTab ? "noopener" : undefined}>
                {marker}
              </a> : <g className={styles.point} role="img" aria-label={label} data-priority={payload.priority}>{marker}</g>;
            }} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>}
  </figure>;
}
