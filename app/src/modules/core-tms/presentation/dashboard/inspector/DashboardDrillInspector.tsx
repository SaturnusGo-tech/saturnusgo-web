"use client";

import { ArrowUpRight, LoaderCircle, RefreshCw, Rows3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardAnalyticsQuery, DashboardDrill, DashboardDrillPage, DashboardDrillRow } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import surface from "../dashboard.module.css";
import { DashboardDrillFacets } from "./facets/DashboardDrillFacets";
import { DashboardDrillTable } from "./table/DashboardDrillTable";
import { isPrioritySignalLevel, prioritySignalRank } from "../../cases/list/PrioritySignal";
import { activeDrillTab, filterDashboardRows, relatedDashboardDrill, type DashboardDrillTab, type DashboardLocalFilters } from "./dashboard-drill-navigation";

const EMPTY_FILTERS: DashboardLocalFilters = {
  query: "", project: [], type: [], component: [], status: [], priority: [],
};
type Props = {
  query: DashboardAnalyticsQuery;
  origin: DashboardDrill;
  selected: DashboardDrill;
  page: DashboardDrillPage | null;
  loading: boolean;
  error: boolean;
  scopeLabel: string;
  onSelectDrill: (drill: DashboardDrill) => void;
  onOpenEntity: (tab: DashboardDrillTab, drill: DashboardDrill) => void;
  onOpenRow: (row: DashboardDrillRow) => void;
  onCreateRun: (caseIds: string[]) => void;
  onClose: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
};

type DrillSort = "recent" | "title" | "status" | "priority_desc" | "priority_asc";

export function DashboardDrillInspector(props: Props) {
  const { locale, t } = useTmsLocale();
  const [tab, setTab] = useState<DashboardDrillTab>(() => activeDrillTab(props.selected.filter));
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<DrillSort>("recent");
  useEffect(() => { setFilters(EMPTY_FILTERS); setSort("recent"); }, [props.selected.id]);
  useEffect(() => { setTab(activeDrillTab(props.origin.filter)); }, [props.origin.id]);
  const rows = useMemo(() => {
    const filtered = filterDashboardRows(props.page?.rows ?? [], filters);
    return [...filtered].sort((left, right) => {
      if (sort === "title") return left.title.localeCompare(right.title);
      if (sort === "status") return (left.status ?? "").localeCompare(right.status ?? "");
      if (sort === "priority_desc" || sort === "priority_asc") {
        const direction = sort === "priority_asc" ? 1 : -1;
        const leftRank = isPrioritySignalLevel(left.priority) ? prioritySignalRank[left.priority] : -1;
        const rightRank = isPrioritySignalLevel(right.priority) ? prioritySignalRank[right.priority] : -1;
        return (leftRank - rightRank) * direction || left.key.localeCompare(right.key, undefined, { numeric: true });
      }
      return Date.parse(right.occurredAt ?? "") - Date.parse(left.occurredAt ?? "");
    });
  }, [filters, props.page?.rows, sort]);
  const tabs: Array<{ id: DashboardDrillTab; label: string; drill: DashboardDrill | null }> = [
    { id: "test_case", label: t("dashboard.testCases"), drill: relatedDashboardDrill(props.origin, "test_case") },
    { id: "run", label: t("dashboard.runs"), drill: relatedDashboardDrill(props.origin, "run") },
    { id: "defect", label: t("dashboard.defects"), drill: relatedDashboardDrill(props.origin, "defect") },
  ];
  const hasPriorityRows = (props.page?.rows ?? []).some((row) => isPrioritySignalLevel(row.priority));
  const selectTab = (next: typeof tabs[number]) => {
    if (!next.drill) return;
    setTab(next.id);
    if (next.drill && next.drill.id !== props.selected.id) props.onSelectDrill(next.drill);
  };

  return <Modal sheet adaptiveSheet title={props.origin.label} subtitle={`${props.scopeLabel} · ${t(`dashboard.period.${props.query.period}`)}`}
    onClose={props.onClose} panelClassName={surface.drillSheet}>
    <nav className={surface.drillTabs} aria-label={t("dashboard.detailSections")}>
      {tabs.map((item) => <button type="button" key={item.id} aria-current={tab === item.id ? "page" : undefined}
        disabled={!item.drill} title={!item.drill ? t("dashboard.relatedUnavailable") : undefined}
        onClick={() => selectTab(item)}>{item.label}{tab === item.id && props.page?.total !== undefined && <span>{props.page.total}</span>}</button>)}
    </nav>
    <div className={surface.drillSheetBody}>
      <DashboardDrillFacets rows={props.page?.rows ?? []} value={filters} onChange={setFilters} />
      <main className={surface.drillResults}>
          <div className={surface.resultsToolbar}><span><Rows3 size={14} />{t("dashboard.visibleRecords", { count: rows.length })}</span><div>
            <label>{t("dashboard.sort")}
            <AnimatedSelect compact className={surface.sortSelect} label={t("dashboard.sort")} value={sort} onChange={(value) => setSort(value as DrillSort)}
              options={[{ value: "recent", label: t("dashboard.sortRecent") }, { value: "title", label: t("dashboard.sortTitle") }, { value: "status", label: t("dashboard.sortStatus") },
                ...(hasPriorityRows ? [{ value: "priority_desc", label: locale === "ru" ? "Приоритет: сначала критические" : "Priority: critical first" },
                  { value: "priority_asc", label: locale === "ru" ? "Приоритет: сначала низкие" : "Priority: low first" }] : [])]} /></label>
            <button type="button" className={surface.drillSectionLink} onClick={() => props.onOpenEntity(tab, props.selected)}>
              {t("dashboard.openSection")}<ArrowUpRight size={14} />
            </button>
          </div></div>
          {props.error ? <div className={surface.drillState} role="alert"><strong>{t("dashboard.drillError")}</strong><button type="button" onClick={props.onRetry}><RefreshCw size={14} />{t("dashboard.retry")}</button></div>
            : props.loading && !props.page ? <div className={surface.drillState} role="status"><LoaderCircle className={surface.spin} size={21} /><span>{t("dashboard.drillLoading")}</span></div>
              : <DashboardDrillTable rows={rows} prioritySort={sort === "priority_desc" ? "desc" : sort === "priority_asc" ? "asc" : null}
                onPrioritySort={() => setSort((current) => current === "priority_desc" ? "priority_asc" : "priority_desc")} onOpenRow={props.onOpenRow} />}
          {props.page?.nextCursor && !props.error && <button type="button" className={surface.loadMore} onClick={props.onLoadMore} disabled={props.loading}>{props.loading && <LoaderCircle className={surface.spin} size={14} />}{t("dashboard.loadMore")}</button>}
      </main>
    </div>
  </Modal>;
}
