"use client";

import { ArrowUpRight, CalendarDays } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { DashboardDrill, DashboardRunOutcome, DashboardSnapshot } from "../../../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../localization/format/labels";
import { OUTCOME_COLORS } from "../../../../charts/model/breakdown-data";
import controls from "../../../../charts/controls/trend-controls.module.css";
import { DashboardSegments, dashboardTabId } from "../../../../common/segments/DashboardSegments";
import { WidgetAction, WidgetCard } from "../card/WidgetCard";
import { completedBucket, completedRunDrill } from "./completed-timeline";
import styles from "./timeline.module.css";

type Props = {
  title: string;
  snapshot: DashboardSnapshot;
  openDrill?: (drill: DashboardDrill) => void;
};

export function DashboardcnTimeline({ title, snapshot, openDrill }: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const copy = locale === "ru" ? {
    subtitle: "Результаты по датам · от новых к старым", all: "Все результаты",
    empty: "За выбранный период нет завершённых прогонов", dateEmpty: "За эту дату нет завершённых прогонов",
    view: "Открыть выборку",
    details: "Прогоны за выбранный интервал", rail: "Интервалы завершения прогонов",
  } : {
    subtitle: "Outcomes by date · newest first", all: "All outcomes",
    empty: "No runs completed in this period", dateEmpty: "No runs completed on this date",
    view: "Open filtered runs",
    details: "Runs in the selected interval", rail: "Run completion intervals",
  };
  const buckets = useMemo(() => snapshot.trend.map(completedBucket).reverse(), [snapshot.trend]);
  const [selection, setSelection] = useState<{ start: string; outcome?: DashboardRunOutcome }>();
  const panelId = useId();
  const bucket = buckets.find(item => item.start === selection?.start) ?? buckets.find(item => item.total > 0)
    ?? (snapshot.metrics.completedRuns > 0 ? buckets[0] : undefined);
  const outcome = bucket?.start === selection?.start && bucket?.outcomes.some(part => part.key === selection?.outcome)
    ? selection?.outcome : undefined;
  const selectedOutcome = outcome ?? "all";
  const formatter = new Intl.DateTimeFormat(languageTag, { month: "short", day: "numeric", timeZone: "UTC" });
  const formatNumber = new Intl.NumberFormat(languageTag);
  const label = (start: string, end: string) => {
    const first = formatter.format(new Date(start));
    const last = formatter.format(new Date(Date.parse(end) - 1));
    return first === last ? first : `${first} – ${last}`;
  };
  const outcomeLabel = (key: DashboardRunOutcome) => key === "incomplete" ? t("dashboard.incomplete")
    : key === "not_started" ? t("dashboard.notStarted") : key === "aborted" ? t("dashboard.aborted") : localizedLabel(locale, key);
  const drill = bucket && completedRunDrill(label(bucket.start, bucket.end), bucket, outcome);
  const max = Math.max(1, ...buckets.map(item => item.total));
  const completed = snapshot.metrics.completedRuns;

  return <WidgetCard heading={title} subtitle={copy.subtitle} className={styles.timeline}
    actions={<span className={styles.total}>{formatNumber.format(completed)} <CalendarDays size={14} aria-hidden="true" /></span>}>
    {completed === 0 || !buckets.length ? <p className={styles.empty}>{copy.empty}</p>
      : <div className={styles.dates} role="group" aria-label={copy.rail}>
        {buckets.map((item, index) => <button key={item.start} type="button" className={styles.date}
          aria-pressed={item.start === bucket?.start}
          tabIndex={item.start === bucket?.start ? 0 : -1}
          aria-label={`${label(item.start, item.end)} · ${formatNumber.format(item.total)}`}
          onKeyDown={event => {
            const positions: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: buckets.length - 1 };
            const next = positions[event.key];
            if (next === undefined) return;
            event.preventDefault();
            if (!buckets[next]) return;
            setSelection({ start: buckets[next].start });
            event.currentTarget.parentElement?.querySelectorAll("button")[next]?.focus();
          }}
          onClick={() => setSelection({ start: item.start })}>
          <span className={styles.chart} aria-hidden="true">
            <span className={styles.bar} style={{ blockSize: `${item.total / max * 100}%` }}>
              {item.outcomes.map(part => <span key={part.key} style={{ flexGrow: part.count,
                backgroundColor: OUTCOME_COLORS[part.key] ?? "var(--muted)" }} />)}
            </span>
          </span>
          <span className={styles.dateLabel}>{formatter.format(new Date(item.start))}</span>
        </button>)}
      </div>}
    {bucket && <section className={styles.details} aria-label={copy.details}>
      <h3>{label(bucket.start, bucket.end)}</h3>
      {bucket.total > 0 ? <div className={styles.selection}>
        <DashboardSegments label={copy.all} panelId={panelId} selectedKey={selectedOutcome} listClassName={controls.segments}
          items={[{ key: "all", label: copy.all, badge: formatNumber.format(bucket.total) }, ...bucket.outcomes.map(item => ({
            key: item.key, label: outcomeLabel(item.key), badge: formatNumber.format(item.count),
          }))]}
          onSelect={key => setSelection({ start: bucket.start, outcome: key === "all" ? undefined : key })} />
        <div id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, selectedOutcome)}>
          {drill && openDrill && <WidgetAction className={styles.open} onClick={() => openDrill(drill)}>
            {copy.view}<ArrowUpRight size={13} aria-hidden="true" />
          </WidgetAction>}
        </div>
      </div> : <p className={styles.empty}>{copy.dateEmpty}</p>}
    </section>}
  </WidgetCard>;
}
