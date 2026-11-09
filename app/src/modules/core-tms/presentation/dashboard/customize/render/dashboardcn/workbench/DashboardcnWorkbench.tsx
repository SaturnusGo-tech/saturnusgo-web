import { ArrowUpRight } from "lucide-react";
import { useId } from "react";
import type { DashboardWorkbenchModel } from "../../../../../../dashboards/workbench/application/useDashboardWorkbench";
import type { WorkbenchRow } from "../../../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../localization/format/labels";
import { DashboardSegments, dashboardTabId } from "../../../../common/segments/DashboardSegments";
import type { DashboardViewProps } from "../../../../dashboard-view";
import { WorkbenchStatus } from "../../../../workbench/controls/WorkbenchStatus";
import { freshnessPages, type FreshnessKind } from "../../../../workbench/freshness/model";
import { freshnessCopy, freshnessIcons } from "../../../../workbench/freshness/presentation";
import { queueCopy, runProgress } from "../../../../workbench/rows/progress/model";
import { compactRunTitle } from "../../../../workbench/rows/title/compact-run-title";
import { WidgetAction, WidgetCard } from "../card/WidgetCard";
import { DistributionBar, MetricValue } from "../../../../../../../../shared/vendor/dashboardcn";
import styles from "../dashboardcn.module.css";
import freshnessStyles from "./dashboardcn-freshness.module.css";

export type Workbench = Pick<DashboardWorkbenchModel, "snapshot" | "loading" | "error" | "enabled" | "refresh" | "tab" | "selectTab"> &
  Partial<Pick<DashboardWorkbenchModel, "openDrill">>;
type OpenRow = DashboardViewProps["onOpenRow"];
const PROGRESS_COLORS = {
  passed: "var(--dash-success)", failed: "var(--dash-danger)", blocked: "var(--dash-warning)",
  skipped: "var(--dash-slate)", inProgress: "var(--dash-blue)", notRun: "var(--control-hover)",
};

export function DashboardcnQueue({ title, model, onOpenRow }: { title: string; model: Workbench; onOpenRow?: OpenRow }) {
  const { t, languageTag } = useTmsLocale();
  const panelId = useId();
  const queue = model.snapshot?.queues[model.tab];
  const updated = model.snapshot && new Intl.DateTimeFormat(languageTag, { hour: "2-digit", minute: "2-digit" })
    .format(new Date(model.snapshot.generatedAt));
  return <WidgetCard heading={title} actions={updated && <small className={styles.updated}>{t("dashboardWorkbench.updated", { date: updated })}</small>}
    aria-busy={model.loading}>
    <DashboardSegments label={title} panelId={panelId} selectedKey={model.tab} listClassName={styles.tabs} onSelect={model.selectTab}
      items={(["activeRuns", "readyForRetest"] as const).map(key => ({
        key, label: t(`dashboardWorkbench.${key}`), badge: model.snapshot?.queues[key].total ?? "—",
      }))} />
    <div className={styles.queueContent} id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, model.tab)} tabIndex={0}>
      <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={Boolean(model.snapshot)} enabled={model.enabled} onRetry={model.refresh} />
      {queue && (queue.rows.length > 0 ? <ul className={styles.queue}>{queue.rows.map(row => <QueueRow
        key={`${row.navigation.projectId}:${row.navigation.entity}:${row.navigation.id}`} row={row} onOpenRow={onOpenRow} />)}</ul>
        : <p className={styles.empty}>{t("dashboardWorkbench.empty")}</p>)}
    </div>
    {queue && <footer className={styles.queueFooter}>
      <span>{t("dashboardWorkbench.totalRows", { shown: queue.rows.length, total: queue.total })}</span>
      {model.openDrill && <WidgetAction onClick={() => model.openDrill?.(model.tab)}>{t("dashboardWorkbench.viewAll")}<ArrowUpRight size={12} aria-hidden="true" /></WidgetAction>}
    </footer>}
  </WidgetCard>;
}

function QueueRow({ row, onOpenRow }: { row: WorkbenchRow; onOpenRow?: OpenRow }) {
  const { locale, t, languageTag } = useTmsLocale();
  const copy = queueCopy[locale];
  const format = new Intl.NumberFormat(languageTag);
  const { navigation: record } = row;
  const progress = row.progress && runProgress(row.progress);
  const title = progress ? compactRunTitle(record.title, record.project, row.buildReference) : record.title;
  return <li>
    <div className={styles.queueRow}>
      <WidgetAction className={styles.queueTitle} onClick={onOpenRow && (() => onOpenRow(record))}>
        <small>{record.key}</small><strong>{title}</strong>{onOpenRow && <ArrowUpRight size={13} aria-hidden="true" />}
      </WidgetAction>
      {progress && <div className={styles.queueProgress}>
        <div><span>{copy.completed(format.format(progress.completed), format.format(progress.total))}</span>
          <MetricValue value={`${format.format(progress.percent)}%`} /></div>
        <DistributionBar showLegend={false} valueFormatter={format.format} segments={progress.segments.map(segment => ({
          name: copy[segment.kind], value: segment.count, color: PROGRESS_COLORS[segment.kind],
        }))} />
      </div>}
      {!progress && <div className={styles.queueSignals}>
        {record.status && <span>{localizedLabel(locale, record.status)}</span>}
        {record.priority && <span>{localizedLabel(locale, record.priority)}</span>}
        {row.attemptNo !== undefined && <span>{t("dashboardWorkbench.attempt", { count: row.attemptNo })}</span>}
      </div>}
      {row.snapshotRevisionNo !== undefined && row.currentRevisionNo !== undefined && <small className={styles.updated}>
        {t("dashboardWorkbench.revision", { snapshot: row.snapshotRevisionNo, current: row.currentRevisionNo })}
      </small>}
    </div>
  </li>;
}

const attention = new Set<FreshnessKind>(["outdatedItems", "runsWithoutBuild", "blockedItems", "openDefects"]);

export function DashboardcnFreshness({ title, model }: { title: string; model: Workbench }) {
  const { locale, languageTag, t } = useTmsLocale();
  const checks = freshnessPages(model.snapshot).flat().sort((left, right) =>
    Number(attention.has(right.kind)) - Number(attention.has(left.kind)));
  const copy = freshnessCopy[locale];
  const format = new Intl.NumberFormat(languageTag);
  const compact = new Intl.NumberFormat(languageTag, { notation: "compact", maximumFractionDigits: 1 });
  return <WidgetCard className={freshnessStyles.panel} heading={title} subtitle={copy.context} aria-busy={model.loading}>
    <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={Boolean(model.snapshot)} enabled={model.enabled} onRetry={model.refresh} />
    <ul className={freshnessStyles.metrics} aria-label={title}>
      {checks.map(check => {
        const Icon = freshnessIcons[check.kind];
        const label = copy.metrics[check.kind];
        const full = check.count === undefined ? "—" : format.format(check.count);
        const display = check.count !== undefined && check.count >= 10000 ? compact.format(check.count) : full;
        const hint = check.hint ? t(`dashboardWorkbench.${check.hint}`) : copy.hints[check.kind];
        const drill = check.count !== undefined && model.openDrill;
        const needsAttention = attention.has(check.kind);
        return <li key={check.kind} data-freshness-kind={check.kind} data-attention={needsAttention || undefined}
          data-flagged={needsAttention && (check.count ?? 0) > 0 || undefined}
          data-unavailable={check.count === undefined || undefined}>
          <WidgetAction className={freshnessStyles.item} title={display === full ? hint : `${full} · ${hint}`}
            aria-label={`${label}: ${full}. ${hint}`} onClick={drill ? () => drill(check.kind) : undefined}>
            <Icon className={freshnessStyles.icon} size={14} aria-hidden="true" />
            <span className={freshnessStyles.label}>{label}</span>
            <MetricValue className={freshnessStyles.value} value={display} />
            {drill && <ArrowUpRight className={freshnessStyles.arrow} size={12} aria-hidden="true" />}
          </WidgetAction>
        </li>;
      })}
    </ul>
  </WidgetCard>;
}
