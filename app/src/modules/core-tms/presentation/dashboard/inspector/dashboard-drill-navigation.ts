import type {
  DashboardDrill, DashboardDrillFilter, DashboardDrillRow,
} from "../../../dashboards/model/dashboard-analytics";

export type DashboardDrillTab = "overview" | "test_case" | "run" | "defect";

export const activeDrillTab = (filter: DashboardDrillFilter): Exclude<DashboardDrillTab, "overview"> =>
  filter.entity === "run_item" ? "run" : filter.entity;

const componentScope = (filter: DashboardDrillFilter) => ({
  ...(filter.component !== undefined ? { component: filter.component } : {}),
  ...(filter.componentIsEmpty ? { componentIsEmpty: true as const } : {}),
});

const caseOnlyScope = (filter: DashboardDrillFilter) => filter.entity === "test_case" &&
  Boolean(filter.type || filter.tag || filter.untagged || filter.coverage);

export function relatedDashboardDrill(
  origin: DashboardDrill,
  tab: Exclude<DashboardDrillTab, "overview">,
): DashboardDrill | null {
  const filter = origin.filter;
  if (activeDrillTab(filter) === tab) return origin;
  if (caseOnlyScope(filter)) return null;
  const shared = componentScope(filter);
  let next: DashboardDrillFilter;
  if (tab === "test_case") next = { entity: "test_case", basis: "current", ...shared };
  else if (tab === "run") next = { entity: "run", basis: "launched", ...shared };
  else next = { entity: "defect", basis: "current", ...shared };
  return {
    id: `${origin.id}:related:${tab}`,
    label: origin.label,
    filter: next,
    ...(origin.projectId ? { projectId: origin.projectId } : {}),
    ...(origin.window ? { window: origin.window } : {}),
  };
}

export function dashboardFilterValues(drill: DashboardDrill) {
  const filter = drill.filter;
  return [
    ...(filter.entity === "test_case" && filter.type ? [{ key: "type", value: filter.type }] : []),
    ...(filter.entity === "test_case" && filter.tag ? [{ key: "tag", value: filter.tag }] : []),
    ...(filter.entity === "test_case" && filter.untagged ? [{ key: "untagged", value: "true" }] : []),
    ...(filter.entity === "test_case" && filter.coverage ? [{ key: "coverage", value: filter.coverage }] : []),
    ...(filter.entity === "run" && filter.status ? [{ key: "status", value: filter.status }] : []),
    ...(filter.entity === "run" && filter.outcome ? [{ key: "outcome", value: filter.outcome }] : []),
    ...(filter.entity === "run" && filter.itemStatus ? [{ key: "itemStatus", value: filter.itemStatus }] : []),
    ...(filter.entity === "run_item" && filter.status ? [{ key: "itemStatus", value: filter.status }] : []),
    ...(filter.entity === "defect" && filter.status ? [{ key: "status", value: filter.status }] : []),
    ...(filter.entity === "defect" && filter.severity ? [{ key: "severity", value: filter.severity }] : []),
    ...(filter.entity === "defect" && filter.activeOnly ? [{ key: "activeOnly", value: "true" }] : []),
    ...("component" in filter && filter.component !== undefined
      ? [{ key: "component", value: filter.component }] : []),
    ...("componentIsEmpty" in filter && filter.componentIsEmpty
      ? [{ key: "componentEmpty", value: "true" }] : []),
  ];
}

export type DashboardLocalFilters = {
  query: string; project: string; type: string; component: string; status: string; priority: string;
};

export function filterDashboardRows(rows: DashboardDrillRow[], filters: DashboardLocalFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    const haystack = [row.key, row.title, row.project, row.component, row.detail, ...(row.tags ?? [])]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return (!query || haystack.includes(query)) && (!filters.project || row.project === filters.project) &&
      (!filters.type || row.type === filters.type) && (!filters.component || row.component === filters.component) &&
      (!filters.status || row.status === filters.status) && (!filters.priority || row.priority === filters.priority);
  });
}
