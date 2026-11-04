"use client";

import { useReducedMotion } from "framer-motion";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActivityMetric, SelfProfileActivity } from "../../../domain/profile-model";
import { profileCopy } from "../../copy/profile-copy";
import styles from "./profile-activity-chart.module.css";

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: readonly { value?: number | string }[];
  metricLabel: string;
  dateLabel: (date: string) => string;
  numberLabel: (value: number) => string;
};

function ActivityTooltip({ active, label, payload, metricLabel, dateLabel, numberLabel }: ChartTooltipProps) {
  const count = payload?.[0]?.value;
  if (!active || label === undefined || count === undefined) return null;
  return <div className={styles.tooltip}>
    <span>{dateLabel(String(label))} · UTC</span>
    <div><i aria-hidden="true" /><span>{metricLabel}</span><strong>{numberLabel(Number(count))}</strong></div>
  </div>;
}

export function ProfileActivityChart({ value, metric, ru }: {
  value: SelfProfileActivity; metric: ActivityMetric; ru: boolean;
}) {
  const reducedMotion = useReducedMotion(), summaryId = useId();
  const locale = ru ? "ru-RU" : "en-US";
  const shortDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const fullDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const numbers = new Intl.NumberFormat(locale);
  const asUtc = (date: string) => new Date(`${date}T00:00:00.000Z`);
  const dateLabel = (date: string) => fullDate.format(asUtc(date));
  const metricLabel = profileCopy(ru).metrics[metric];
  const total = numbers.format(value.totals[metric]);
  const data = value.series.map(point => ({ date: point.date, count: point[metric] }));
  const description = `${metricLabel}: ${total}. ${ru ? "Ежедневная активность за" : "Daily activity over"} ${value.days} ${ru ? "дней" : "days"}. UTC.`;

  return <figure className={styles.figure} data-metric={metric} aria-labelledby={summaryId}>
    <figcaption className={styles.visuallyHidden} id={summaryId}>{description}</figcaption>
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 5, left: 0 }} accessibilityLayer aria-label={description}>
          <CartesianGrid vertical={false} stroke="var(--falcon-border)" strokeOpacity={0.55} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={42} tickMargin={12}
            tickFormatter={date => shortDate.format(asUtc(String(date)))}
            tick={{ fill: "var(--falcon-text-muted)", fontSize: 11 }} />
          <YAxis width={36} axisLine={false} tickLine={false} allowDecimals={false} tickMargin={10}
            domain={[0, (maximum: number) => Math.max(1, maximum)]} tickCount={4}
            tickFormatter={count => numbers.format(Number(count))}
            tick={{ fill: "var(--falcon-text-muted)", fontSize: 11 }} />
          <Tooltip cursor={{ stroke: "var(--falcon-border-strong, var(--falcon-text-muted))", strokeWidth: 1 }}
            content={<ActivityTooltip metricLabel={metricLabel} dateLabel={dateLabel} numberLabel={count => numbers.format(count)} />}
            isAnimationActive={reducedMotion === false} animationDuration={120} />
          <Area dataKey="count" name={metricLabel} type="linear" stroke="var(--profile-series)" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" fill="var(--profile-series)" fillOpacity={0.065}
            dot={data.length === 1 ? { r: 3, strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: "var(--profile-series)", stroke: "var(--falcon-surface)", strokeWidth: 2 }}
            isAnimationActive={reducedMotion === false} animationDuration={240} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <details className={styles.details}>
      <summary>{ru ? "Данные по дням" : "Daily data"}</summary>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={ru ? "Таблица активности" : "Activity data table"}>
        <table>
          <caption className={styles.visuallyHidden}>{description}</caption>
          <thead><tr><th scope="col">{ru ? "Дата · UTC" : "Date · UTC"}</th><th scope="col">{metricLabel}</th></tr></thead>
          <tbody>{data.map(point => <tr key={point.date}>
            <th scope="row"><time dateTime={point.date}>{dateLabel(point.date)}</time></th><td>{numbers.format(point.count)}</td>
          </tr>)}</tbody>
          <tfoot><tr><th scope="row">{ru ? "Всего" : "Total"}</th><td>{total}</td></tr></tfoot>
        </table>
      </div>
    </details>
  </figure>;
}
