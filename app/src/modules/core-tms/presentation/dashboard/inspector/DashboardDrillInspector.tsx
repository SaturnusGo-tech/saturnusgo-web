"use client";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Bootstrap } from "../../../../../core/tms/contracts/legacy-contract";
import type { DashboardAnalyticsQuery, DashboardDrill, DashboardDrillPage, DashboardDrillRow } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { DashboardDrillTable } from "./table/DashboardDrillTable";
import { activeDrillTab, filterDashboardRows, relatedDashboardDrill, type DashboardDrillTab } from "./dashboard-drill-navigation";
import { DetailPage, DetailState, DetailFooter } from "../detail/DetailPage";
import { DetailToolbar, emptyDetailFilters, type DetailSort } from "../detail/toolbar/DetailToolbar";
import { sortDetailRows } from "../detail/toolbar/sort-rows";
import { ComponentRail } from "../detail/components/ComponentRail";
import { GroupedChecks } from "../detail/groups/GroupedChecks";
import { groupRunRecords } from "../detail/groups/group-records";
import { compactRunTitle } from "../workbench/rows/title/compact-run-title";
import styles from "../detail/detail.module.css";

type Props = {
  data: Bootstrap; components: string[]; query: DashboardAnalyticsQuery; origin: DashboardDrill; selected: DashboardDrill;
  page: DashboardDrillPage | null; loading: boolean; error: boolean; scopeLabel: string;
  onSelectDrill: (drill: DashboardDrill) => void; onSelectComponent: (drill: DashboardDrill) => void;
  onOpenEntity: (tab: DashboardDrillTab, drill: DashboardDrill) => void;
  onOpenRow: (row: DashboardDrillRow) => void; onCreateRun: (caseIds: string[]) => void;
  onClose: () => void; onRetry: () => void; onLoadMore: () => void;
};
export function DashboardDrillInspector(props: Props) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const [filters, setFilters] = useState(emptyDetailFilters); const [sort, setSort] = useState<DetailSort>("recent");
  const [selection, setSelection] = useState(new Set<string>());
  const tab = activeDrillTab(props.selected.filter);
  const canCreateRun = props.data.meta.authorization.capabilities.includes("run:manage");
  const rows = useMemo(() => sortDetailRows(filterDashboardRows(props.page?.rows ?? [], filters), sort).map(row => {
    if (row.entity !== "run") return row;
    const known = props.data.runs.find(run => run.id === row.id && run.projectId === row.projectId);
    return { ...row, title: compactRunTitle(row.title, row.project, known?.build ?? null) };
  }), [filters, props.page, sort, props.data.runs]);
  const originFilter = props.origin.filter;
  const componentContext = originFilter.component !== undefined || originFilter.componentIsEmpty || props.origin.id.startsWith("component-context:");
  const component = originFilter.componentIsEmpty ? "" : originFilter.component;
  const title = componentContext ? component === "" ? (ru ? "Без компонента" : "No component") : component ?? (ru ? "Все компоненты" : "All components") : props.origin.label;
  const total = props.page?.total ?? (props.page && !props.page.nextCursor ? props.page.rows.length : undefined);
  const tabs = (["test_case", "run", "defect"] as const).map(id => ({ id, drill: relatedDashboardDrill(props.origin, id),
    label: t(id === "test_case" ? "dashboard.testCases" : id === "run" ? "dashboard.runs" : "dashboard.defects") }));
  const chooseComponent = (next?: string) => props.onSelectComponent({ id: `component-context:${next ?? "all"}`, label: next ?? (ru ? "Все компоненты" : "All components"),
    projectId: props.origin.projectId ?? props.query.projectId, window: props.origin.window,
    filter: { entity: "test_case", basis: "current", ...(next === "" ? { componentIsEmpty: true } : next !== undefined ? { component: next } : {}) } });
  const statuses = [...new Set(props.page?.rows.flatMap(row => row.status ? [row.status] : []) ?? [])];
  const filtered = Boolean(filters.query || Object.entries(filters).some(([key, value]) => key !== "query" && value.length));
  return <DetailPage title={title} context={`${props.scopeLabel} · ${t(`dashboard.period.${props.query.period}`)}`} count={componentContext ? undefined : total}
    onBack={props.onClose} rail={componentContext ? <ComponentRail components={props.components} selected={component} onSelect={chooseComponent} /> : undefined}
    action={{ label: t(tab === "run" ? "dashboard.runs" : tab === "defect" ? "nav.reports" : "dashboard.testCases"), onClick: () => props.onOpenEntity(tab, props.selected) }}>
    {componentContext ? <nav className={styles.tabs} aria-label={t("dashboard.detailSections")}>
      {tabs.map(item => <button type="button" key={item.id} disabled={!item.drill} aria-current={tab === item.id ? "page" : undefined}
        onClick={() => item.drill && props.onSelectDrill(item.drill)}>{item.label}{tab === item.id && total !== undefined && <span>{total}</span>}</button>)}
      {tab === "test_case" && canCreateRun && <button type="button" data-action disabled={!selection.size} onClick={() => props.onCreateRun([...selection])}><Plus size={14} />{ru ? "Создать прогон" : "Create run"}{selection.size > 0 && <span>{selection.size}</span>}</button>}
    </nav> : null}
    <DetailToolbar rows={props.page?.rows ?? []} filters={filters} onFilters={setFilters} sort={sort} onSort={setSort} partial={Boolean(props.page?.nextCursor)} />
    {!componentContext && statuses.length > 1 && <nav className={styles.tabs} aria-label={t("dashboard.status")}>
      <button type="button" aria-current={!filters.status.length ? "page" : undefined} onClick={() => setFilters({ ...filters, status: [] })}>{ru ? "Все" : "All"}</button>
      {statuses.map(status => <button type="button" key={status} aria-current={filters.status[0] === status ? "page" : undefined}
        onClick={() => setFilters({ ...filters, status: [status] })}>{localizedLabel(locale, status)}</button>)}
    </nav>}
    <div aria-busy={props.loading}>
      <DetailState loading={props.loading && !props.page} error={props.error ? t("dashboard.drillError") : null} empty={Boolean(props.page) && !rows.length} filtered={filtered} onRetry={props.onRetry} />
      {props.selected.filter.entity === "run_item" ? <GroupedChecks groups={groupRunRecords(rows, props.data)} onOpenRow={props.onOpenRow} />
        : <DashboardDrillTable rows={rows} onOpenRow={props.onOpenRow} selection={componentContext && canCreateRun ? selection : undefined} onSelection={setSelection}
          prioritySort={sort === "priority_desc" ? "desc" : sort === "priority_asc" ? "asc" : null}
          onPrioritySort={() => setSort(value => value === "priority_desc" ? "priority_asc" : "priority_desc")} />}
    </div>
    {props.page && <DetailFooter shown={rows.length} total={total} more={Boolean(props.page.nextCursor) && !props.error} loading={props.loading} onMore={props.onLoadMore} />}
  </DetailPage>;
}
