export type DashboardPeriod = "7d" | "30d" | "90d";
export type DashboardCaseType = "manual" | "checklist" | "automated";
export type DashboardRunOutcome = "passed" | "failed" | "blocked" | "incomplete" | "not_started" | "aborted";
export type DashboardExecutionStatus = "not_run" | "in_progress" | "passed" | "failed" | "blocked" | "skipped";

export type DashboardAnalyticsQuery = {
  workspaceId: string;
  projectId?: string;
  period: DashboardPeriod;
};

export type DashboardDrillFilter =
  | {
      entity: "test_case";
      basis: "current" | "created";
      type?: DashboardCaseType;
      tag?: string;
      untagged?: boolean;
      component?: string;
      componentIsEmpty?: boolean;
      coverage?: "covered" | "uncovered";
    }
  | {
      entity: "run";
      basis: "launched" | "completed" | "active";
      status?: "draft" | "active" | "completed" | "aborted";
      outcome?: DashboardRunOutcome;
      component?: string;
      componentIsEmpty?: boolean;
      itemStatus?: "passed" | "failed" | "blocked" | "skipped";
    }
  | {
      entity: "run_item";
      status?: DashboardExecutionStatus;
      component?: string;
      componentIsEmpty?: boolean;
    }
  | {
      entity: "defect";
      basis: "reported" | "current";
      status?: string;
      hasLink?: boolean;
      component?: string;
      componentIsEmpty?: boolean;
      severity?: "low" | "medium" | "high" | "critical";
      activeOnly?: boolean;
      runId?: string;
      testCaseId?: string;
    };

export type DashboardDrill = {
  id: string;
  label: string;
  projectId?: string;
  window?: { from: string; to: string };
  filter: DashboardDrillFilter;
};

export type DashboardDrillRequest = {
  query: DashboardAnalyticsQuery;
  drill: DashboardDrill;
  cursor?: string;
  limit?: number;
};

export type DashboardDrillRow = {
  id: string;
  key: string;
  title: string;
  project: string;
  detail: string;
  status?: string;
  occurredAt?: string;
  links: Array<{ label: string; url: string }>;
};

export type DashboardDrillPage = {
  rows: DashboardDrillRow[];
  nextCursor?: string;
  total?: number;
};

export type DashboardTrendPoint = {
  day: string;
  start: string;
  end: string;
  launched: number;
  passed: number;
  failed: number;
  blocked: number;
  incomplete: number;
  not_started: number;
  aborted: number;
  passRate: number | null;
};

export type DashboardDimensionDatum<Key extends string = string> = {
  key: Key;
  label: string;
  value: number;
  drill: DashboardDrill;
};

export type DashboardHotspot = {
  id: string;
  kind: "project" | "component";
  label: string;
  projectLabel?: string;
  caseCount: number;
  coveredCases: number | null;
  failedItems: number | null;
  blockedItems: number | null;
  openDefects: number | null;
  criticalDefects: number | null;
  passRate: number | null;
  coverageRate: number | null;
  drills: {
    cases: DashboardDrill;
    covered?: DashboardDrill;
    uncovered?: DashboardDrill;
    passed?: DashboardDrill;
    failures?: DashboardDrill;
    blocked?: DashboardDrill;
    defects?: DashboardDrill;
    criticalDefects?: DashboardDrill;
  };
};

export type DashboardSnapshot = {
  generatedAt: string;
  query: DashboardAnalyticsQuery;
  metrics: {
    currentCases: number;
    casesCreated: number;
    runsLaunched: number;
    completedRuns: number;
    passedRuns: number;
    activeRuns: number;
    currentDefects: number;
    openDefects: number;
    reportedDefects: number;
    linkedDefects: number;
    passRate: number | null;
  };
  trend: DashboardTrendPoint[];
  runOutcomes: Array<DashboardDimensionDatum<DashboardRunOutcome>>;
  caseTypes: Array<DashboardDimensionDatum<DashboardCaseType>>;
  tags: DashboardDimensionDatum[];
  hotspots: DashboardHotspot[];
  defects: DashboardDimensionDatum[];
  dataNotes: string[];
};

export interface DashboardAnalyticsSource {
  summary(query: DashboardAnalyticsQuery, signal?: AbortSignal): Promise<DashboardSnapshot>;
  drill(request: DashboardDrillRequest, signal?: AbortSignal): Promise<DashboardDrillPage>;
}
