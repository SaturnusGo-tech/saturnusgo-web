import { ErrorToast } from "../../../../../common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../../shared/components/loading/LoadingOrb";
import { Button } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardSnapshot } from
  "../../../../../../dashboards/model/dashboard-analytics";
import type { DashboardDefectBreakdownRequest, DashboardDefectGroup, DashboardDefectSegment } from
  "../../../../../../dashboards/model/breakdown/dashboard-defect-breakdown";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../localization/format/labels";
import type { DashboardViewProps } from "../../../../dashboard-view";
import { InsightsChart } from "./chart/InsightsChart";
import { InsightsList } from "./chart/InsightsList";
import { InsightsControls, type InsightControl } from "./controls/InsightsControls";
import { insightCopy } from "./controls/insight-copy";
import { sliceDistribution, type SliceKind } from "./dashboardcn-slices";
import { defectInsightView, sliceInsightView, type InsightMeasure } from "./model/insight-view";
import { useDefectInsights } from "./model/useDefectInsights";
import { useDashboardWidgetPending } from "../../../../loading/readiness/DashboardReadiness";
import { InsightsRecords } from "./records/InsightsRecords";
import styles from "./dashboardcn-slices.module.css";

type Props = {
  title: string;
  snapshot: DashboardSnapshot;
  kind: SliceKind;
  openDrill?: (drill: DashboardDrill) => void;
  onOpenRow?: DashboardViewProps["onOpenRow"];
  readDrill?: DashboardAnalyticsSource["drill"];
  readDefectBreakdown?: DashboardAnalyticsSource["defectBreakdown"];
  interactive?: boolean;
};

const dimensions: readonly DashboardDefectGroup[] = ["assignee", "component", "project", "status", "priority", "severity"];
const segments: readonly DashboardDefectSegment[] = ["none", "status", "priority", "severity"];

export function DashboardcnSlices({ title, snapshot, kind, openDrill, onOpenRow, readDrill, readDefectBreakdown, interactive = true }: Props) {
  const { t, locale, languageTag } = useTmsLocale();
  const copy = insightCopy[locale];
  const reduceMotion = useReducedMotion();
  const isDefect = kind === "defects";
  const [metric, setMetric] = useState("current");
  const [dimension, setDimension] = useState<DashboardDefectGroup>("assignee");
  const [segment, setSegment] = useState<DashboardDefectSegment>("status");
  const [filter, setFilter] = useState("all");
  const [selection, setSelection] = useState<{ key: string; drillId: string }>();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const surface = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setCanExpand(document.fullscreenEnabled);
    const update = () => setExpanded(document.fullscreenElement === surface.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const visibleMetric = interactive ? metric : "current";
  const visibleFilter = interactive ? filter : "all";
  const linked = isDefect && visibleMetric === "current" && visibleFilter === "linked";
  const request = useMemo<DashboardDefectBreakdownRequest | null>(() => interactive && isDefect && readDefectBreakdown ? {
    query: snapshot.query, basis: visibleMetric === "current" ? "current" : "reported",
    groupBy: dimension, segmentBy: segment, ...(linked ? { hasLink: true } : {}),
  } : null, [interactive, isDefect, readDefectBreakdown, snapshot.query, snapshot.generatedAt, visibleMetric, dimension, segment, linked]);
  const result = useDefectInsights(request, readDefectBreakdown);
  const grouped = Boolean(request && result.data !== null);
  const { all, segments: buckets, related } = sliceDistribution(snapshot, kind, visibleMetric === "current" ? "current" : "created");
  const fallback = isDefect && (linked || visibleMetric === "period")
    ? related.find(item => item.key === (linked ? "linked" : "reported")) ?? all : all;
  const fallbackLabel = fallback.message ? t(fallback.message) : fallback.key;
  const fallbackView = isDefect && fallback !== all
    ? { groups: [{ ...fallback, drill: { ...fallback.drill, label: fallbackLabel }, color: "var(--insight-iris)", cells: [], label: fallbackLabel }],
      total: fallback.count, groupCount: 1 }
    : sliceInsightView(all, buckets, locale, isDefect ? "all" : visibleFilter);
  const displayed = result.data && request ? { data: result.data, request }
    : grouped ? result.previous : undefined;
  useDashboardWidgetPending(Boolean(request && result.loading && !displayed));
  const view = displayed ? defectInsightView(displayed.data, displayed.request, locale)
    : grouped ? { groups: [], total: undefined, groupCount: 0 } : fallbackView;
  const number = new Intl.NumberFormat(languageTag);
  const scope = JSON.stringify([snapshot.query, visibleMetric, visibleFilter, grouped, dimension, segment]);
  const selected = interactive && selection?.key === scope ? view.groups.flatMap(group => [group, ...group.cells])
    .find(item => item.drill?.id === selection.drillId) : undefined;
  const updating = Boolean(result.loading || result.error);
  const closeRecords = () => setSelection(undefined);
  const select = interactive && (readDrill || openDrill)
    ? (item: InsightMeasure) => { if (item.drill) setSelection({ key: scope, drillId: item.drill.id }); }
    : undefined;
  const labels = {
    current: isDefect ? copy.currentDefects : copy.currentCases, period: copy.new,
    dimension: isDefect ? grouped ? copy[displayed?.request.groupBy ?? dimension] : fallback === all ? copy.status : copy.total : copy.type,
  };
  const filters = isDefect ? [{ key: "all", label: copy.all }, ...(visibleMetric === "current" ? [{ key: "linked", label: copy.linked }] : [])]
    : [{ key: "all", label: copy.allTypes }, ...buckets.filter(item => item.count !== undefined)
      .map(item => ({ key: item.key, label: localizedLabel(locale, item.key) }))];
  const controls: InsightControl[] = [
    { label: copy.metric, value: visibleMetric, options: [{ key: "current", label: labels.current }, { key: "period", label: labels.period }],
      onChange: interactive ? value => { setMetric(value); setFilter("all"); closeRecords(); } : undefined },
    { label: copy.dimension, value: isDefect && grouped ? dimension : "fixed", options: isDefect && grouped
      ? dimensions.map(key => ({ key, label: copy[key] })) : [{ key: "fixed", label: labels.dimension }],
      onChange: interactive && grouped ? value => { setDimension(value as DashboardDefectGroup); closeRecords(); } : undefined },
    { label: copy.segment, value: isDefect && grouped ? segment : "none", options: isDefect && grouped
      ? segments.map(key => ({ key, label: copy[key] })) : [{ key: "none", label: copy.none }],
      onChange: interactive && grouped ? value => { setSegment(value as DashboardDefectSegment); closeRecords(); } : undefined },
    { label: isDefect ? copy.scope : copy.caseType, value: visibleFilter, options: filters,
      onChange: interactive ? value => { setFilter(value); closeRecords(); } : undefined },
  ];
  const fullscreen = () => {
    const next = expanded ? document.exitFullscreen() : surface.current?.requestFullscreen();
    void next?.catch(() => undefined);
  };
  const portalContainer = expanded ? surface.current ?? undefined : undefined;
  const empty = result.loading ? t("dashboard.summaryLoading") : result.error ? t("dashboard.summaryError") : copy.noRecords;

  return <section ref={surface} className={styles.surface} aria-label={title}>
    <header className={styles.toolbar}>
      <h2>{title}</h2>
      {interactive && canExpand && <Button isIconOnly variant="light" size="sm" className={styles.expand}
        aria-label={expanded ? copy.collapse : copy.expand} onPress={fullscreen}>
        {expanded ? <Minimize2 size={11} aria-hidden="true" /> : <Maximize2 size={11} aria-hidden="true" />}
      </Button>}
    </header>
    <div className={styles.body}>
      <div className={styles.primary}>
        <div className={styles.visual} aria-busy={result.loading} data-updating={Boolean(displayed && updating) || undefined}>
          <InsightsChart groups={view.groups} number={number} label={labels.dimension} selected={selected?.drill?.id} onSelect={select} updating={updating}
            markers={isDefect && grouped && (displayed?.request.groupBy ?? dimension) === "assignee" ? "person" : "label"} />
          <InsightsList groups={view.groups} number={number} dimension={labels.dimension} metric={copy.count} empty={empty}
            selected={selected?.drill?.id} onSelect={select} updating={updating} />
          {"truncated" in view && view.truncated && <p className={styles.truncated}>
            {copy.coverage(number.format(view.groups.length), number.format(view.groupCount))}
          </p>}
        </div>
        {result.loading && <span role="status" className={styles.loading}>
          <LoadingOrb /> {t("dashboard.summaryLoading")}
        </span>}
        <ErrorToast message={result.error ? t("dashboard.summaryError") : null}
          retryLabel={t("dashboard.retry")} onRetry={result.retry} />
        <AnimatePresence initial={false}>
          {selected && <motion.div key="records" className={styles.recordTransition} initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.17 }}>
            <InsightsRecords item={selected} query={snapshot.query} revision={snapshot.generatedAt} readDrill={readDrill}
              openDrill={openDrill} onOpenRow={onOpenRow} onClose={closeRecords} />
          </motion.div>}
        </AnimatePresence>
      </div>
      <InsightsControls total={view.total === undefined ? "—" : number.format(view.total)}
        noun={isDefect ? copy.defects : copy.cases} controls={controls} portalContainer={portalContainer} />
    </div>
  </section>;
}
