"use client";

import { LoaderCircle, Play, RefreshCw, Rows3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardAnalyticsQuery, DashboardDrill, DashboardDrillPage, DashboardDrillRow } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { Modal } from "../../common/modal/Modal";
import surface from "../dashboard.module.css";
import { DashboardDrillFacets } from "./facets/DashboardDrillFacets";
import { DashboardDrillTable } from "./table/DashboardDrillTable";
import { activeDrillTab, dashboardFilterValues, filterDashboardRows, relatedDashboardDrill, type DashboardDrillTab, type DashboardLocalFilters } from "./dashboard-drill-navigation";

const EMPTY_FILTERS: DashboardLocalFilters = {
  query: "", project: "", type: "", component: "", status: "", priority: "",
};
const MIX_TONES = ["mixTeal", "mixPlum", "mixSand", "mixOlive", "mixCoral", "mixSlate"];

type Props = {
  query: DashboardAnalyticsQuery;
  origin: DashboardDrill;
  selected: DashboardDrill;
  page: DashboardDrillPage | null;
  loading: boolean;
  error: boolean;
  scopeLabel: string;
  onSelectDrill: (drill: DashboardDrill) => void;
  onOpenEntity: (tab: Exclude<DashboardDrillTab, "overview">, drill: DashboardDrill) => void;
  onOpenRow: (row: DashboardDrillRow) => void;
  onCreateRun: (caseIds: string[]) => void;
  onClose: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
};

export function DashboardDrillInspector(props: Props) {
  const { locale, t } = useTmsLocale();
  const [tab, setTab] = useState<DashboardDrillTab>(() => activeDrillTab(props.selected.filter));
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("recent");
  useEffect(() => { setFilters(EMPTY_FILTERS); }, [props.selected.id]);
  useEffect(() => { setTab(activeDrillTab(props.origin.filter)); }, [props.origin.id]);
  const rows = useMemo(() => {
    const filtered = filterDashboardRows(props.page?.rows ?? [], filters);
    return [...filtered].sort((left, right) => sort === "title"
      ? left.title.localeCompare(right.title)
      : sort === "status" ? (left.status ?? "").localeCompare(right.status ?? "")
        : Date.parse(right.occurredAt ?? "") - Date.parse(left.occurredAt ?? ""));
  }, [filters, props.page?.rows, sort]);
  const projects = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of props.page?.rows ?? []) counts.set(row.project, (counts.get(row.project) ?? 0) + 1);
    return [...counts].sort((left, right) => right[1] - left[1]);
  }, [props.page?.rows]);
  const filterLabel = (key: string) => ({
    type: t("dashboard.filter.type"), tag: t("dashboard.filter.tag"),
    coverage: t("dashboard.filter.coverage"), status: t("dashboard.filter.status"),
    outcome: t("dashboard.filter.outcome"), itemStatus: t("dashboard.filter.itemStatus"),
    severity: t("dashboard.filter.severity"), component: t("dashboard.filter.component"),
    untagged: t("dashboard.filter.untagged"), activeOnly: t("dashboard.filter.activeOnly"),
    componentEmpty: t("dashboard.filter.componentEmpty"),
  })[key] ?? key;
  const context = dashboardFilterValues(props.origin).map(({ key, value }) => {
    if (key === "tag") return `#${value}`;
    if (["untagged", "activeOnly", "componentEmpty"].includes(key)) return filterLabel(key);
    return `${filterLabel(key)}: ${localizedLabel(locale, value)}`;
  });
  const tabs: Array<{ id: DashboardDrillTab; label: string; drill?: DashboardDrill | null }> = [
    { id: "overview", label: t("dashboard.overview") },
    { id: "test_case", label: t("dashboard.testCases"), drill: relatedDashboardDrill(props.origin, "test_case") },
    { id: "run", label: t("dashboard.runs"), drill: relatedDashboardDrill(props.origin, "run") },
    { id: "defect", label: t("dashboard.defects"), drill: relatedDashboardDrill(props.origin, "defect") },
  ];
  const selectTab = (next: typeof tabs[number]) => {
    if (next.id !== "overview" && !next.drill) return;
    setTab(next.id);
    if (next.drill && next.drill.id !== props.selected.id) props.onSelectDrill(next.drill);
  };
  const activeEntity = tab === "overview" ? activeDrillTab(props.selected.filter) : tab;

  return <Modal sheet title={props.origin.label} subtitle={`${t("dashboard.analyticsTitle")} / ${t(`dashboard.tab.${activeDrillTab(props.origin.filter)}`)}`}
    onClose={props.onClose} panelClassName={surface.drillSheet}>
    <div className={surface.drillSheetToolbar}>
      <div className={surface.humanFilters}><span>{props.scopeLabel}</span><span>{t(`dashboard.period.${props.query.period}`)}</span>
        {context.map((label) => <span key={label}>{label}</span>)}</div>
      <div className={surface.drillActions}>
        {activeEntity === "test_case" && (props.selected.projectId ?? props.query.projectId) && rows.length > 0 && <button type="button" onClick={() => props.onCreateRun(rows.map((row) => row.id))}><Play size={14} />{t("dashboard.createRunFromLoaded")}</button>}
        <button type="button" className={surface.drillPrimaryAction} onClick={() => props.onOpenEntity(activeEntity, props.selected)}>{t(`dashboard.open.${activeEntity}`)}</button>
      </div>
    </div>
    <nav className={surface.drillTabs} aria-label={t("dashboard.detailSections")}>
      {tabs.map((item) => <button type="button" key={item.id} aria-current={tab === item.id ? "page" : undefined}
        disabled={item.id !== "overview" && !item.drill} title={!item.drill && item.id !== "overview" ? t("dashboard.relatedUnavailable") : undefined}
        onClick={() => selectTab(item)}>{item.label}{tab === item.id && item.id !== "overview" && props.page?.total !== undefined ? ` ${props.page.total}` : ""}</button>)}
    </nav>
    <div className={surface.drillSheetBody}>
      <DashboardDrillFacets rows={props.page?.rows ?? []} value={filters} onChange={setFilters} />
      <main className={surface.drillResults}>
        <section className={surface.loadedDistribution} aria-label={t("dashboard.loadedDistribution")}>
          <header><div><h3>{t("dashboard.loadedDistribution")}</h3><p>{t("dashboard.loadedDistributionHint")}</p></div><strong>{props.page?.total ?? props.page?.rows.length ?? 0}</strong></header>
          <div className={surface.mixBar}>{projects.map(([name, count], index) => <i key={name} className={surface[MIX_TONES[index % MIX_TONES.length]]} style={{ flexGrow: count }} title={`${name}: ${count}`} />)}</div>
          <div className={surface.mixLegend}>{projects.slice(0, 6).map(([name, count], index) => <span key={name}><i className={surface[MIX_TONES[index % MIX_TONES.length]]} />{name}<b>{count}</b></span>)}</div>
        </section>
        {tab === "overview" ? <section className={surface.drillOverview}>
          <div><span>{t("dashboard.loadedRecords")}</span><strong>{props.page?.rows.length ?? 0}</strong></div>
          <div><span>{t("dashboard.visibleAfterRefine")}</span><strong>{rows.length}</strong></div>
          <div><span>{t("dashboard.projectsRepresented")}</span><strong>{projects.length}</strong></div>
        </section> : <>
          <div className={surface.resultsToolbar}><span><Rows3 size={14} />{t("dashboard.visibleRecords", { count: rows.length })}</span><label>{t("dashboard.sort")}<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">{t("dashboard.sortRecent")}</option><option value="title">{t("dashboard.sortTitle")}</option><option value="status">{t("dashboard.sortStatus")}</option></select></label></div>
          {props.error ? <div className={surface.drillState} role="alert"><strong>{t("dashboard.drillError")}</strong><button type="button" onClick={props.onRetry}><RefreshCw size={14} />{t("dashboard.retry")}</button></div>
            : props.loading && !props.page ? <div className={surface.drillState} role="status"><LoaderCircle className={surface.spin} size={21} /><span>{t("dashboard.drillLoading")}</span></div>
              : <DashboardDrillTable rows={rows} onOpenRow={props.onOpenRow} />}
          {props.page?.nextCursor && !props.error && <button type="button" className={surface.loadMore} onClick={props.onLoadMore} disabled={props.loading}>{props.loading && <LoaderCircle className={surface.spin} size={14} />}{t("dashboard.loadMore")}</button>}
        </>}
      </main>
    </div>
  </Modal>;
}
