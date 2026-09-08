import type { DashboardDimensionDatum, DashboardHotspot } from "../../../../dashboards/model/dashboard-analytics";

export const TYPE_COLORS: Record<string, string> = {
  manual: "var(--dash-blue)", automated: "var(--dash-success)", checklist: "var(--dash-slate)",
};
export const OUTCOME_COLORS: Record<string, string> = {
  passed: "var(--dash-success)", failed: "var(--dash-danger)", blocked: "var(--dash-warning)",
  incomplete: "var(--dash-slate)", not_started: "var(--dash-slate)", aborted: "var(--dash-aborted)",
};
export const DEFECT_COLORS: Record<string, string> = {
  open: "var(--dash-danger)", triaged: "var(--dash-warning)", in_progress: "var(--dash-orange)",
  ready_for_retest: "var(--dash-blue)", verified: "var(--dash-success)",
  closed: "var(--dash-slate)", reopened: "var(--dash-violet)",
};

export function composition(items: readonly DashboardDimensionDatum[]) {
  const positive = items.filter((item) => Number.isFinite(item.value) && item.value > 0);
  const total = positive.reduce((sum, item) => sum + item.value, 0);
  return positive.map((item) => ({ ...item, share: item.value / total * 100 }));
}

export function rankedTags(items: readonly DashboardDimensionDatum[], limit = 6) {
  return [...items].filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0, limit);
}

export function coverageGapsFirst(items: readonly DashboardHotspot[], limit = 6) {
  return items.filter((item) => item.coveredCases !== null && item.caseCount > 0 &&
    item.drills.covered && item.drills.uncovered)
    .map((item) => ({ ...item, coveredCases: item.coveredCases!,
      coverageRate: item.coveredCases! / item.caseCount * 100,
      uncoveredCases: Math.max(0, item.caseCount - item.coveredCases!),
    }))
    .sort((a, b) => a.coverageRate - b.coverageRate || b.uncoveredCases - a.uncoveredCases ||
      a.label.localeCompare(b.label)).slice(0, limit);
}
