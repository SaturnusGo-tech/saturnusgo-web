import type { DashboardDrill, DashboardRunOutcome, DashboardTrendPoint } from "../../../../../../dashboards/model/dashboard-analytics";

const outcomes = ["passed", "failed", "blocked", "incomplete", "not_started", "aborted"] as const;

export function completedBucket(point: DashboardTrendPoint) {
  const buckets = outcomes.map(key => ({ key, count: point[key] })).filter(({ count }) => count > 0);
  return {
    start: point.start, end: point.end,
    total: buckets.reduce((sum, { count }) => sum + count, 0),
    outcomes: buckets,
  };
}

export function completedRunDrill(label: string, bucket: ReturnType<typeof completedBucket>, outcome?: DashboardRunOutcome): DashboardDrill {
  return {
    id: `completed:${bucket.start}:${outcome ?? "all"}`, label,
    window: { from: bucket.start, to: bucket.end },
    filter: { entity: "run", basis: "completed", ...(outcome && { outcome }) },
  };
}
