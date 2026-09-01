import type { Bootstrap, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import type {
  DashboardAnalyticsQuery, DashboardCaseType, DashboardDrill, DashboardDrillFilter,
  DashboardRunOutcome, DashboardSnapshot, DashboardTrendPoint,
} from "./dashboard-analytics";

const day = (value: string) => value.slice(0, 10);
const time = (value: string | null | undefined) => value ? Date.parse(value) : 0;
const periodDays = (period: DashboardAnalyticsQuery["period"]) => Number(period.slice(0, -1));
const inRange = (value: string | null | undefined, start: number) => time(value) >= start;

function drill(id: string, label: string, filter: DashboardDrillFilter, projectId?: string): DashboardDrill {
  return { id, label, filter, ...(projectId ? { projectId } : {}) };
}

function runOutcome(run: TestRunSummary): DashboardRunOutcome | null {
  if (run.status === "aborted") return "aborted";
  if (run.status === "draft" || run.progress.total === 0) return "not_started";
  if (run.status !== "completed") return "incomplete";
  if (run.progress.counts.failed > 0) return "failed";
  if (run.progress.counts.blocked > 0) return "blocked";
  if (run.progress.counts.passed === run.progress.total) return "passed";
  return "incomplete";
}

export function createDashboardSnapshot(data: Bootstrap, query: DashboardAnalyticsQuery): DashboardSnapshot {
  const scoped = <T extends { projectId: string }>(items: T[]) => query.projectId
    ? items.filter((item) => item.projectId === query.projectId)
    : items;
  const cases = scoped(data.testCases).filter((item) => !item.archivedAt);
  const runs = scoped(data.runs);
  const defects = scoped(data.defects);
  const currentDefects = defects.filter((item) => !["verified", "closed"].includes(item.status));
  const end = new Date(data.meta.generatedAt);
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - periodDays(query.period) + 1);
  const startTime = start.getTime();
  const trend = new Map<string, DashboardTrendPoint>();

  for (let offset = 0; offset < periodDays(query.period); offset += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    const key = date.toISOString().slice(0, 10);
    const bucketEnd = new Date(date);
    bucketEnd.setUTCDate(date.getUTCDate() + 1);
    trend.set(key, { day: key, start: date.toISOString(), end: bucketEnd.toISOString(),
      launched: 0, passed: 0, failed: 0, blocked: 0, incomplete: 0,
      not_started: 0, aborted: 0, passRate: null });
  }
  for (const run of runs) {
    const launched = run.startedAt ? trend.get(day(run.startedAt)) : undefined;
    if (launched) launched.launched += 1;
    const outcome = runOutcome(run);
    const completedAt = run.completedAt ?? (run.status === "aborted" ? run.startedAt : null);
    const completed = outcome && completedAt ? trend.get(day(completedAt)) : undefined;
    if (completed && outcome) completed[outcome] += 1;
  }
  const points = [...trend.values()];
  const completedRuns = runs.filter((run) => {
    const occurredAt = run.completedAt ?? (run.status === "aborted" ? run.startedAt : null);
    return runOutcome(run) && inRange(occurredAt, startTime);
  });
  const outcomeCount = (value: DashboardRunOutcome) => completedRuns
    .filter((run) => runOutcome(run) === value).length;
  const passedRuns = outcomeCount("passed");
  const linkedIds = new Set(data.externalLinks
    .filter((link) => link.owner.kind === "defect" && link.status === "active")
    .map((link) => link.owner.kind === "defect" ? link.owner.defectId : ""));
  const linkedDefects = defects.filter((item) =>
    (item.externalIssue?.syncStatus !== "deleted" && Boolean(item.externalIssue)) || linkedIds.has(item.id)).length;
  const typeCount = (value: DashboardCaseType) => cases.filter((item) => item.type === value).length;
  const caseTypes = (["manual", "checklist", "automated"] as const).map((type) => ({
    key: type, label: type, value: typeCount(type),
    drill: drill(`cases:type:${type}`, type, { entity: "test_case", basis: "current", type }),
  }));
  const tagCounts = new Map<string, number>();
  for (const item of cases) {
    for (const tag of new Set(item.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const tags = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20)
    .map(([tag, value]) => ({
      key: tag, label: tag, value,
      drill: drill(`cases:tag:${tag}`, tag, { entity: "test_case", basis: "current", tag }),
    }));
  const projectName = new Map(data.projects.map((project) => [project.id, project.name]));
  const groups = query.projectId
    ? [...new Set(cases.map((item) => item.component.trim()))].map((component) => ({
        id: component || "empty", label: component || "—", projectId: query.projectId!, kind: "component" as const,
      }))
    : data.projects.filter((project) => project.status !== "archived")
      .map((project) => ({ id: project.id, label: project.name, projectId: project.id, kind: "project" as const }));
  const hotspots = groups.map((group) => {
    const groupCases = group.kind === "project"
      ? cases.filter((item) => item.projectId === group.projectId)
      : cases.filter((item) => item.component.trim() === (group.id === "empty" ? "" : group.id));
    const groupDefects = currentDefects.filter((item) => group.kind === "project"
      ? item.projectId === group.projectId
      : item.component.trim() === (group.id === "empty" ? "" : group.id));
    const caseFilter = group.kind === "component"
      ? { entity: "test_case" as const, basis: "current" as const, ...(group.id === "empty" ? { componentIsEmpty: true } : { component: group.id }) }
      : { entity: "test_case" as const, basis: "current" as const };
    const componentFilter = group.kind === "component"
      ? (group.id === "empty" ? { componentIsEmpty: true } : { component: group.id })
      : {};
    return {
      id: `${group.kind}:${group.id}`, kind: group.kind, label: group.label,
      projectLabel: projectName.get(group.projectId), caseCount: groupCases.length,
      coveredCases: null, failedItems: null, blockedItems: null, openDefects: groupDefects.length,
      criticalDefects: groupDefects.filter((item) => item.severity === "critical").length,
      passRate: null, coverageRate: null,
      drills: {
        cases: drill(`hotspot:${group.id}:cases`, group.label, caseFilter, group.projectId),
        defects: drill(`hotspot:${group.id}:defects`, group.label, { entity: "defect", basis: "current", activeOnly: true, ...componentFilter }, group.projectId),
        criticalDefects: drill(`hotspot:${group.id}:critical`, group.label, { entity: "defect", basis: "current", activeOnly: true, severity: "critical", ...componentFilter }, group.projectId),
      },
    };
  }).sort((a, b) => (b.failedItems ?? -1) - (a.failedItems ?? -1)
    || (b.blockedItems ?? -1) - (a.blockedItems ?? -1)
    || (b.criticalDefects ?? 0) - (a.criticalDefects ?? 0)
    || (b.openDefects ?? 0) - (a.openDefects ?? 0)
    || a.label.localeCompare(b.label)).slice(0, 12);
  const defectStatuses = ["open", "triaged", "in_progress", "ready_for_retest", "verified", "closed", "reopened"];

  return {
    generatedAt: data.meta.generatedAt, query,
    metrics: {
      currentCases: cases.length, casesCreated: cases.filter((item) => inRange(item.createdAt, startTime)).length,
      runsLaunched: runs.filter((item) => inRange(item.startedAt, startTime)).length,
      completedRuns: completedRuns.length, passedRuns, activeRuns: runs.filter((item) => item.status === "active").length,
      currentDefects: defects.length, openDefects: currentDefects.length,
      reportedDefects: defects.filter((item) => inRange(item.createdAt, startTime)).length,
      linkedDefects, passRate: null,
    },
    trend: points,
    runOutcomes: (["passed", "failed", "blocked", "incomplete", "not_started", "aborted"] as const).map((outcome) => ({
      key: outcome, label: outcome, value: outcomeCount(outcome),
      drill: drill(`runs:outcome:${outcome}`, outcome, { entity: "run", basis: "completed", outcome }),
    })),
    caseTypes, tags,
    hotspots,
    defects: defectStatuses.map((status) => ({
      key: status, label: status, value: defects.filter((item) => item.status === status).length,
      drill: drill(`defects:status:${status}`, status, { entity: "defect", basis: "current", status }),
    })),
    dataNotes: ["component-run-attribution-unavailable"],
  };
}
