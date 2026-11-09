import type { KeyboardEvent } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import type { DashboardDefectBreakdown } from "../../../../../../dashboards/model/breakdown/dashboard-defect-breakdown";
import type { DefectLeadTimePage } from "../../../../../../dashboards/source/performance/readDashboardDefectLeadTime";
import { localizedLabel } from "../../../../../../localization/format/labels";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import type { DashboardViewProps } from "../../../../dashboard-view";
import styles from "./performance.module.css";

const priorityOrder = ["critical", "high", "medium", "low"] as const;
const priorityColors = ["var(--performance-orange)", "var(--performance-gold)", "var(--performance-green)", "var(--performance-cyan)"];
const statusColors = {
  open: "var(--performance-muted)", triaged: "var(--performance-muted)", in_progress: "var(--performance-gold)",
  ready_for_retest: "var(--performance-cyan)", verified: "var(--performance-violet)", closed: "var(--performance-slate)",
  reopened: "var(--performance-orange)",
};
const compactRussianStatuses: Record<string, string> = {
  triaged: "Триаж", in_progress: "В работе", ready_for_retest: "На QA", verified: "Проверен", reopened: "Снова открыт",
};
const keyboardPress = (event: KeyboardEvent, onPress: () => void) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPress(); }
};

export function LeadTimePlot({ points, onOpenRow }: {
  points: DefectLeadTimePage["data"]; onOpenRow?: DashboardViewProps["onOpenRow"];
}) {
  const { locale, languageTag } = useTmsLocale();
  const days = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 1 });
  const dayUnit = locale === "ru" ? "дн." : "d";
  const values = points.map(point => {
    const priority = priorityOrder.indexOf(point.priority);
    const hash = [...point.id].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
    const nudge = (hash % 19 - 9) / 48;
    return { ...point, position: priority + nudge, color: priorityColors[priority] };
  });
  return <div className={styles.chart}>
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 14, bottom: 0, left: 0, right: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="position" domain={[-.5, 3.5]} ticks={[0, 1, 2, 3]}
          stroke="var(--chart-grid)" height={19} tickLine={false} tick={({ x, y, payload }) => {
            const index = Number(payload.value);
            const priority = priorityOrder[index];
            const label = localizedLabel(locale, priority);
            return <g transform={`translate(${Number(x) - 5}, ${Number(y) - 1})`} aria-label={label} fill={priorityColors[index]}>
              <title>{label}</title>
              {priority === "critical" ? <>
                <rect width={10} height={10} rx={1.5} />
                <path d="M5 2.1v3.5m0 1.9v.1" stroke="var(--panel-surface)" strokeWidth={1.15} strokeLinecap="round" />
              </> : [4, 7, 10].map((height, bar) => <rect key={height} x={bar * 4} y={10 - height}
                width={2} height={height} rx={.6} opacity={bar < 4 - index ? 1 : .35} />)}
            </g>;
          }} />
        <YAxis type="number" dataKey="leadTimeDays" domain={[0, "auto"]} orientation="right" width={42}
          tick={{ fill: "var(--panel-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={value => value ? `${days.format(value)} ${dayUnit}` : "0"} />
        <Scatter data={values} isAnimationActive={false} shape={input => {
          const { cx, cy, payload } = input as { cx: number; cy: number; payload: typeof values[number] };
          const value = payload.leadTimeDays > 0 && payload.leadTimeDays < .1
            ? `< ${days.format(.1)}` : days.format(payload.leadTimeDays);
          const archive = payload.archived ? ` · ${locale === "ru" ? "В архиве" : "Archived"}` : "";
          const label = `${payload.key} ${payload.title} · ${value} ${dayUnit}${archive}`;
          const open = !payload.archived && onOpenRow ? () => onOpenRow({
            id: payload.id, projectId: payload.projectId, entity: "defect", key: payload.key, title: payload.title,
            project: "", detail: "", priority: payload.priority, occurredAt: payload.resolvedAt, links: [],
          }) : undefined;
          return <g aria-label={label} role={open ? "button" : undefined} tabIndex={0}
            onClick={open} onKeyDown={open ? event => keyboardPress(event, open) : undefined} className={styles.point}>
            <title>{label}</title>
            <circle cx={cx} cy={cy} r={10} fill="transparent" />
            <circle cx={cx} cy={cy} r={2.15} fill={payload.color} />
          </g>;
        }} />
      </ScatterChart>
    </ResponsiveContainer>
  </div>;
}

export function ReportedPlot({ data, onPick }: {
  data: DashboardDefectBreakdown; onPick?: (status: string, label: string) => void;
}) {
  const { locale, languageTag } = useTmsLocale();
  const number = new Intl.NumberFormat(languageTag);
  const maximum = Math.max(1, ...data.groups.map(group => group.count));
  const step = Math.max(1, Math.ceil(maximum / 5));
  const scale = Math.ceil(maximum / step) * step;
  const ticks = Array.from({ length: 1 + scale / step }, (_, index) => scale - index * step);
  const status = new Map(data.groups.map(group => [group.key, group.count]));
  return <div className={styles.reportChart}>
    <div className={styles.gridLines} aria-hidden="true">{ticks.map(tick =>
      <div key={tick}><span>{number.format(tick)}</span></div>)}</div>
    <div className={styles.statusBars}>
      {Object.entries(statusColors).map(([key, color]) => {
        const count = status.get(key) ?? 0;
        const label = localizedLabel(locale, key);
        return <button type="button" key={key} disabled={!onPick || count === 0} aria-label={`${label} · ${number.format(count)}`}
          onClick={() => onPick?.(key, label)} className={styles.status}>
          <span className={styles.barTrack}><span style={{ height: `${count / scale * 100}%`, backgroundColor: color }} /></span>
          <span className={styles.statusLabel}>
            <span className={styles.fullStatus}>{label}</span>
            <span className={styles.compactStatus}>{locale === "ru" ? compactRussianStatuses[key] ?? label : label}</span>
          </span>
        </button>;
      })}
    </div>
  </div>;
}
