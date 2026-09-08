import type { DashboardSnapshot, DashboardDrill } from "../../../../../dashboards/model/dashboard-analytics";
import type { DashboardWorkbenchModel } from "../../../../../dashboards/workbench/application/useDashboardWorkbench";
import type { WorkbenchKind } from "../../../../../dashboards/workbench/model/workbench";

type Metric = { value: number | null | undefined; percent?: boolean; drill?: DashboardDrill; kind?: WorkbenchKind };
export function metricValue(key: string, snapshot: DashboardSnapshot | null, workbench: DashboardWorkbenchModel): Metric {
  const counts = workbench.snapshot?.counts; const freshness = workbench.snapshot?.freshness;
  const live: Record<string, number | undefined> = {
    activeRuns: counts?.activeRuns, readyForRetest: counts?.readyForRetest,
    blockedItems: counts?.blockedActiveItems, openDefects: counts?.openDefects,
    notRunItems: freshness?.notRunActiveItems, inProgressItems: freshness?.inProgressActiveItems,
    outdatedItems: freshness?.outdatedActiveItems, runsWithoutBuild: freshness?.activeRunsWithoutBuild,
  };
  if (key in live) return { value: live[key], kind: key as WorkbenchKind };
  if (!snapshot) return { value: undefined };
  if (key.startsWith("type:")) {
    const item = snapshot.caseTypes.find((item) => item.key === key.slice(5));
    return { value: item?.value, drill: item?.drill };
  }
  if (key.startsWith("defect:")) {
    const item = snapshot.defects.find((item) => item.key === key.slice(7));
    return { value: item?.value, drill: item?.drill };
  }
  const filters: Record<string, DashboardDrill["filter"]> = {
    currentCases: { entity: "test_case", basis: "current" }, casesCreated: { entity: "test_case", basis: "created" },
    runsLaunched: { entity: "run", basis: "launched" }, completedRuns: { entity: "run", basis: "completed" },
    passedRuns: { entity: "run", basis: "completed", outcome: "passed" }, passRate: { entity: "run", basis: "completed" },
    currentDefects: { entity: "defect", basis: "current" }, reportedDefects: { entity: "defect", basis: "reported" },
    linkedDefects: { entity: "defect", basis: "current", hasLink: true },
  };
  const value = snapshot.metrics[key as keyof DashboardSnapshot["metrics"]];
  return { value, percent: key === "passRate", ...(filters[key] ? { drill: { id: `widget:${key}`, label: key, filter: filters[key] } } : {}) };
}
