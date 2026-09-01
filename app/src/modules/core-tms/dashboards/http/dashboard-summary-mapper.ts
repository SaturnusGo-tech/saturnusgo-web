import type { components } from "../../../../core/tms/generated/tms-api";
import type {
  DashboardAnalyticsQuery, DashboardDrill, DashboardDrillFilter, DashboardHotspot,
  DashboardSnapshot,
} from "../model/dashboard-analytics";

type Api = components["schemas"];
type Summary = Api["DashboardAnalyticsSummary"];
type Risk = Api["AnalyticsProjectRiskHotspot"] | Api["AnalyticsComponentRiskHotspot"];

const percent = (value: number | null) => value === null ? null : Math.round(value * 1000) / 10;
const drill = (id: string, label: string, filter: DashboardDrillFilter,
  projectId?: string): DashboardDrill => ({ id, label, filter, ...(projectId ? { projectId } : {}) });
const componentFilter = (item: Risk) => "component" in item
  ? item.component === null ? { componentIsEmpty: true as const } : { component: item.component }
  : {};

function hotspot(item: Risk, kind: DashboardHotspot["kind"]): DashboardHotspot {
  const component = componentFilter(item);
  const label = "component" in item ? item.component ?? "—" : item.projectName;
  const id = `${kind}:${item.projectId}:${"component" in item ? item.component ?? "empty" : "project"}`;
  const caseFilter = { entity: "test_case" as const, basis: "current" as const, ...component };
  return {
    id, kind, label, projectLabel: item.projectName, caseCount: item.currentTestCases,
    coveredCases: item.coveredTestCases, failedItems: item.failedRunItems,
    blockedItems: item.blockedRunItems, openDefects: item.openDefects,
    criticalDefects: item.criticalOpenDefects, passRate: percent(item.passRate),
    coverageRate: percent(item.coverageRate),
    drills: {
      cases: drill(`${id}:cases`, label, caseFilter, item.projectId),
      covered: drill(`${id}:covered`, label, { ...caseFilter, coverage: "covered" }, item.projectId),
      uncovered: drill(`${id}:uncovered`, label, { ...caseFilter, coverage: "uncovered" }, item.projectId),
      passed: drill(`${id}:passed`, label, { entity: "run_item", status: "passed", ...component }, item.projectId),
      failures: drill(`${id}:failed`, label, { entity: "run_item", status: "failed", ...component }, item.projectId),
      blocked: drill(`${id}:blocked`, label, { entity: "run_item", status: "blocked", ...component }, item.projectId),
      defects: drill(`${id}:defects`, label, { entity: "defect", basis: "current", activeOnly: true, ...component }, item.projectId),
      criticalDefects: drill(`${id}:critical`, label, { entity: "defect", basis: "current", activeOnly: true, severity: "critical", ...component }, item.projectId),
    },
  };
}

const itemPassRate = (summary: Summary) => {
  const items = summary.runs.timeline.buckets.reduce((total, bucket) => ({
    passed: total.passed + bucket.completedItems.passed,
    rated: total.rated + bucket.completedItems.passed + bucket.completedItems.failed +
      bucket.completedItems.blocked,
  }), { passed: 0, rated: 0 });
  return items.rated ? Math.round((items.passed / items.rated) * 1000) / 10 : null;
};

export function mapDashboardAnalyticsSummary(summary: Summary,
  query: DashboardAnalyticsQuery): DashboardSnapshot {
  const outcomeCount = new Map(summary.runs.completedInPeriod.byOutcome
    .map((item) => [item.key, item.count]));
  const statusCount = new Map(summary.defects.current.byStatus.map((item) => [item.key, item.count]));
  const risks = query.projectId
    ? summary.riskHotspots.byComponent.hotspots.map((item) => hotspot(item, "component"))
    : summary.riskHotspots.byProject.hotspots.map((item) => hotspot(item, "project"));
  const riskDimension = query.projectId
    ? summary.riskHotspots.byComponent : summary.riskHotspots.byProject;
  const activeDefects = [...statusCount].reduce((total, [status, count]) =>
    status === "closed" || status === "verified" ? total : total + count, 0);

  return {
    generatedAt: summary.generatedAt, query,
    metrics: {
      currentCases: summary.testCases.current.total,
      casesCreated: summary.testCases.createdInPeriod,
      runsLaunched: summary.runs.launchedInPeriod.total,
      completedRuns: summary.runs.completedInPeriod.total,
      passedRuns: outcomeCount.get("passed") ?? 0,
      activeRuns: summary.runs.currentActive.total,
      currentDefects: summary.defects.current.total,
      openDefects: activeDefects,
      reportedDefects: summary.defects.reportedInPeriod.total,
      linkedDefects: summary.defects.current.linked,
      passRate: itemPassRate(summary),
    },
    trend: summary.runs.timeline.buckets.map((bucket) => ({
      day: bucket.start.slice(0, 10), start: bucket.start, end: bucket.end,
      launched: bucket.launched, passed: bucket.completedOutcomes.passed,
      failed: bucket.completedOutcomes.failed, blocked: bucket.completedOutcomes.blocked,
      incomplete: bucket.completedOutcomes.incomplete,
      not_started: bucket.completedOutcomes.notStarted,
      aborted: bucket.completedOutcomes.aborted, passRate: percent(bucket.passRate),
    })),
    runOutcomes: summary.runs.completedInPeriod.byOutcome.map((item) => ({
      key: item.key, label: item.key, value: item.count,
      drill: drill(`runs:outcome:${item.key}`, item.key,
        { entity: "run", basis: "completed", outcome: item.key }),
    })),
    caseTypes: summary.testCases.current.byType.map((item) => ({
      key: item.key, label: item.key, value: item.count,
      drill: drill(`cases:type:${item.key}`, item.key,
        { entity: "test_case", basis: "current", type: item.key }),
    })),
    tags: summary.testCases.current.byTag.buckets.map((item) => ({
      key: item.key, label: item.key, value: item.count,
      drill: drill(`cases:tag:${item.key}`, item.key,
        { entity: "test_case", basis: "current", tag: item.key }),
    })),
    hotspots: risks,
    defects: summary.defects.current.byStatus.map((item) => ({
      key: item.key, label: item.key, value: item.count,
      drill: drill(`defects:status:${item.key}`, item.key,
        { entity: "defect", basis: "current", status: item.key }),
    })),
    dataNotes: [
      ...(summary.testCases.current.byTag.truncated ? ["tags-truncated"] : []),
      ...(riskDimension.truncated ? ["risk-truncated"] : []),
    ],
  };
}
