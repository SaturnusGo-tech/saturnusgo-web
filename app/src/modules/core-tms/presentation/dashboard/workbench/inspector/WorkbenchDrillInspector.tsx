import { useNavigationValue } from "../../../../state/navigation/context/useNavigationValue";
import { useMemo, useState } from "react";
import type { Bootstrap } from "../../../../../../core/tms/contracts/legacy-contract";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import type { WorkbenchKind } from "../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { DetailPage, DetailState, DetailFooter } from "../../detail/DetailPage";
import { DetailToolbar, emptyDetailFilters, type DetailSort } from "../../detail/toolbar/DetailToolbar";
import { sortDetailRows } from "../../detail/toolbar/sort-rows";
import { filterDashboardRows } from "../../inspector/dashboard-drill-navigation";
import { DashboardDrillTable } from "../../inspector/table/DashboardDrillTable";
import { GroupedChecks } from "../../detail/groups/GroupedChecks";
import { groupRunRecords } from "../../detail/groups/group-records";
import { compactRunTitle } from "../rows/title/compact-run-title";
import styles from "../../detail/detail.module.css";
const checkTabs: WorkbenchKind[] = ["notRunItems", "inProgressItems", "outdatedItems", "runsWithoutBuild", "blockedItems"];
export function WorkbenchDrillInspector({ model, data, scopeLabel, onOpenRow, onOpenSection, onBack }: {
  model: DashboardWorkbenchModel; data: Bootstrap; scopeLabel: string; onOpenRow: (row: DashboardDrillRow) => void;
  onOpenSection: (defects: boolean) => void; onBack: () => void;
}) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const [filters, setFilters] = useNavigationValue(`workbench:${data.workspace.id}:${model.drill?.kind}:filters`, emptyDetailFilters()); const [sort, setSort] = useNavigationValue<DetailSort>(`workbench:${data.workspace.id}:${model.drill?.kind}:sort`, "recent");
  const drill = model.drill; const queue = drill?.page?.queue;
  const allRows = useMemo(() => queue?.rows.map(item => ({ ...item.navigation,
    ...(item.navigation.entity === "run" ? { title: compactRunTitle(item.navigation.title, item.navigation.project, item.buildReference), progress: item.progress } : {}),
  })) ?? [], [queue]);
  const rows = useMemo(() => sortDetailRows(filterDashboardRows(allRows, filters), sort), [allRows, filters, sort]);
  if (!drill) return null;
  const checks = checkTabs.includes(drill.kind); const defects = ["openDefects", "readyForRetest"].includes(drill.kind);
  const grouped = checks && drill.kind !== "runsWithoutBuild";
  const labels: Partial<Record<WorkbenchKind, string>> = ru
    ? { notRunItems: "Не начаты", inProgressItems: "Выполняются", outdatedItems: "Новые редакции", runsWithoutBuild: "Без сборки", blockedItems: "Заблокированы" }
    : { notRunItems: "Not started", inProgressItems: "In progress", outdatedItems: "New revisions", runsWithoutBuild: "Without a build", blockedItems: "Blocked" };
  const selectedContext = [scopeLabel, model.snapshot?.choices.environments.find(item => item.id === model.filters.environmentId)?.name, model.filters.buildReference].filter(Boolean).join(" · ");
  return <DetailPage title={checks ? (ru ? "Актуальность проверок" : "Check freshness") : t(`dashboardWorkbench.${drill.kind}`)}
    context={selectedContext} count={checks ? undefined : queue?.total} onBack={onBack}
    action={{ label: ru ? defects ? "Открыть отчёты" : "Все прогоны" : defects ? "Open reports" : "All runs", onClick: () => onOpenSection(defects) }}>
    {checks && <nav className={styles.tabs} aria-label={ru ? "Актуальность проверок" : "Check freshness"}>
      {checkTabs.map(kind => <button type="button" key={kind} aria-current={drill.kind === kind ? "page" : undefined}
        onClick={() => model.openDrill(kind)}>{labels[kind]}{model.snapshot && <span>{model.snapshot.queues[kind].total}</span>}</button>)}
    </nav>}
    <DetailToolbar rows={allRows} filters={filters} onFilters={setFilters} sort={sort} onSort={setSort} partial={Boolean(drill.page?.nextCursor)} />
    <div aria-busy={drill.loading}>
      <DetailState loading={drill.loading && !drill.page} error={drill.error ? t(`dashboardWorkbench.error.${drill.error.kind}`) : null}
        empty={Boolean(queue) && !rows.length} filtered={Boolean(filters.query || Object.entries(filters).some(([key, value]) => key !== "query" && value.length))} onRetry={model.retryDrill} />
      {grouped ? <GroupedChecks groups={groupRunRecords(rows, data)} onOpenRow={onOpenRow} />
        : <DashboardDrillTable rows={rows} onOpenRow={onOpenRow} prioritySort={sort === "priority_desc" ? "desc" : sort === "priority_asc" ? "asc" : null}
          onPrioritySort={() => setSort(value => value === "priority_desc" ? "priority_asc" : "priority_desc")} />}
    </div>
    {queue && <DetailFooter shown={rows.length} total={queue.total} more={Boolean(drill.page?.nextCursor) && !drill.error} loading={drill.loading} onMore={model.loadMore} />}
  </DetailPage>;
}
