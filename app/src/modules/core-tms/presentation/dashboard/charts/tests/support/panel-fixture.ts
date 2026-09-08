import type { DashboardDimensionDatum, DashboardHotspot, DashboardSnapshot } from "../../../../../dashboards/model/dashboard-analytics";

export const datum = (key: string, value: number): DashboardDimensionDatum => ({
  key, label: key, value, drill: { id: key, label: key, filter: { entity: "test_case", basis: "current", tag: key } },
});
export const hotspot = (label: string, coveredCases: number, caseCount: number): DashboardHotspot => ({
  id: label, label, kind: "component", projectLabel: "Product", coveredCases, caseCount,
  coverageRate: caseCount ? coveredCases / caseCount * 100 : null, passRate: 80,
  failedItems: 2, blockedItems: 1, openDefects: 3, criticalDefects: 1,
  drills: {
    cases: { id: `${label}:cases`, label, projectId: "project", filter: { entity: "test_case", basis: "current", component: label } },
    covered: { id: `${label}:covered`, label, projectId: "project", filter: { entity: "test_case", basis: "current", component: label, coverage: "covered" } },
    uncovered: { id: `${label}:uncovered`, label, projectId: "project", filter: { entity: "test_case", basis: "current", component: label, coverage: "uncovered" } },
    passed: { id: `${label}:passed`, label, filter: { entity: "run_item", status: "passed", component: label } },
    failures: { id: `${label}:failed`, label, filter: { entity: "run_item", status: "failed", component: label } },
    blocked: { id: `${label}:blocked`, label, filter: { entity: "run_item", status: "blocked", component: label } },
    defects: { id: `${label}:defects`, label, filter: { entity: "defect", basis: "current", component: label } },
    criticalDefects: { id: `${label}:critical`, label, filter: { entity: "defect", basis: "current", component: label, severity: "critical" } },
  },
});
export const panelData: DashboardSnapshot = {
  generatedAt: "2026-09-08T12:00:00Z", query: { workspaceId: "workspace", projectId: "project", period: "30d" },
  metrics: { currentCases: 400, casesCreated: 12, runsLaunched: 28, completedRuns: 6, passedRuns: 5,
    activeRuns: 2, currentDefects: 24, openDefects: 22, reportedDefects: 24, linkedDefects: 24, passRate: 83.3 },
  trend: [], dataNotes: [],
  caseTypes: [datum("manual", 300), datum("automated", 100), datum("checklist", 0)] as DashboardSnapshot["caseTypes"],
  tags: [datum("low", 10), datum("high", 375), datum("middle", 100)],
  hotspots: [hotspot("Complete", 5, 5), hotspot("Partial", 7, 9), hotspot("Gap", 0, 10)],
  defects: [datum("open", 15), datum("ready_for_retest", 7), datum("closed", 0), datum("verified", 2)],
  runOutcomes: [datum("passed", 5), datum("failed", 1), datum("blocked", 0), datum("incomplete", 0),
    datum("not_started", 0), datum("aborted", 0)] as DashboardSnapshot["runOutcomes"],
};
