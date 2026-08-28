import type {
  Activity,
  Bootstrap,
  TestRunSummary,
} from "../../../../../core/tms/contracts/legacy-contract";

export type DashboardTrendPoint = {
  day: string;
  executed: number;
  passed: number;
  passRate: number | null;
  failures: number;
  defects: number;
  runs: number;
};

export type DashboardSnapshot = {
  cases: number;
  casesCreated: number;
  runsStarted: number;
  runsStartedRecent: number;
  failures: number;
  failuresRecent: number;
  openDefects: number;
  defectsCreated: number;
  passRate: number;
  executed: number;
  trend: DashboardTrendPoint[];
  distribution: Array<{ status: "failed" | "blocked" | "skipped"; value: number }>;
  recentRuns: TestRunSummary[];
  recentActivity: Activity[];
};

const dayKey = (value: string) => value.slice(0, 10);
const timestamp = (value: string | null) => value ? Date.parse(value) : 0;

export function createDashboardSnapshot(
  data: Bootstrap,
  projectId: string,
): DashboardSnapshot {
  const cases = data.testCases.filter((item) => item.projectId === projectId && !item.archivedAt);
  const runs = data.runs.filter((item) => item.projectId === projectId);
  const defects = data.defects.filter((item) => item.projectId === projectId);
  const openDefects = defects.filter((item) => !["verified", "closed"].includes(item.status));
  const end = new Date(data.meta.generatedAt);
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  const startTime = start.getTime();
  const points = new Map<string, DashboardTrendPoint>();

  for (let offset = 0; offset < 30; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    const day = date.toISOString().slice(0, 10);
    points.set(day, { day, executed: 0, passed: 0, passRate: null, failures: 0, defects: 0, runs: 0 });
  }

  for (const run of runs) {
    const startPoint = run.startedAt ? points.get(dayKey(run.startedAt)) : undefined;
    if (startPoint) startPoint.runs += 1;
    const outcomePoint = points.get(dayKey(run.completedAt ?? run.startedAt ?? run.createdAt));
    if (!outcomePoint) continue;
    outcomePoint.executed += run.progress.executed;
    outcomePoint.passed += run.progress.counts.passed;
    outcomePoint.failures += run.progress.counts.failed;
  }
  for (const defect of defects) {
    const point = points.get(dayKey(defect.createdAt));
    if (point) point.defects += 1;
  }

  const trend = [...points.values()].map((point) => ({
    ...point,
    passRate: point.executed ? Math.round((point.passed / point.executed) * 1000) / 10 : null,
  }));
  const executed = runs.reduce((sum, run) => sum + run.progress.executed, 0);
  const passed = runs.reduce((sum, run) => sum + run.progress.counts.passed, 0);
  const countRecent = (value: string | null) => timestamp(value) >= startTime;

  return {
    cases: cases.length,
    casesCreated: cases.filter((item) => countRecent(item.createdAt)).length,
    runsStarted: runs.filter((item) => item.startedAt).length,
    runsStartedRecent: runs.filter((item) => countRecent(item.startedAt)).length,
    failures: runs.reduce((sum, run) => sum + run.progress.counts.failed, 0),
    failuresRecent: runs.filter((run) => countRecent(run.completedAt ?? run.startedAt ?? run.createdAt))
      .reduce((sum, run) => sum + run.progress.counts.failed, 0),
    openDefects: openDefects.length,
    defectsCreated: defects.filter((item) => countRecent(item.createdAt)).length,
    passRate: executed ? Math.round((passed / executed) * 1000) / 10 : 0,
    executed,
    trend,
    distribution: (["failed", "blocked", "skipped"] as const).map((status) => ({
      status,
      value: runs.reduce((sum, run) => sum + run.progress.counts[status], 0),
    })),
    recentRuns: [...runs]
      .sort((a, b) => timestamp(b.startedAt ?? b.createdAt) - timestamp(a.startedAt ?? a.createdAt))
      .slice(0, 5),
    recentActivity: [...data.activity]
      .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))
      .slice(0, 5),
  };
}
