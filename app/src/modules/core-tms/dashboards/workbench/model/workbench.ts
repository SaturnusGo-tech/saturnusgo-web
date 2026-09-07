import type { DashboardDrillRow } from "../../model/dashboard-analytics";

export type WorkbenchScope = { workspaceId: string; projectId?: string };
export type WorkbenchFilters = { environmentId: string; buildReference: string };
export type WorkbenchKind = "activeRuns" | "readyForRetest" | "blockedItems" | "openDefects"
  | "notRunItems" | "inProgressItems" | "outdatedItems" | "runsWithoutBuild";
export type WorkbenchProgress = {
  total: number; notRun: number; inProgress: number; passed: number;
  failed: number; blocked: number; skipped: number;
};
export type WorkbenchRow = {
  navigation: DashboardDrillRow;
  environmentName: string | null;
  buildReference: string | null;
  updatedAt: string;
  progress?: WorkbenchProgress;
  attemptNo?: number;
  snapshotRevisionNo?: number;
  currentRevisionNo?: number;
};
export type WorkbenchQueue = { rows: WorkbenchRow[]; total: number; truncated: boolean };
export type WorkbenchSnapshot = {
  scope: WorkbenchScope;
  filters: WorkbenchFilters;
  generatedAt: string;
  asOf: string;
  counts: { activeRuns: number; readyForRetest: number; blockedActiveItems: number; openDefects: number };
  freshness: {
    notRunActiveItems: number; inProgressActiveItems: number;
    outdatedActiveItems: number; activeRunsWithoutBuild: number;
  };
  queues: Record<WorkbenchKind, WorkbenchQueue>;
  choices: {
    environments: Array<{ projectId: string; projectName: string; id: string; name: string }>;
    builds: string[];
    environmentsTruncated: boolean;
    buildsTruncated: boolean;
  };
};
export type WorkbenchQuery = WorkbenchScope & WorkbenchFilters & { limit: number };
export type WorkbenchRecordsQuery = WorkbenchQuery & { kind: WorkbenchKind; cursor?: string };
export type WorkbenchPage = {
  queue: WorkbenchQueue; generatedAt: string; asOf: string; nextCursor: string | null;
};
export interface DashboardWorkbenchSource {
  read(query: WorkbenchQuery, signal?: AbortSignal): Promise<WorkbenchSnapshot>;
  records(query: WorkbenchRecordsQuery, signal?: AbortSignal): Promise<WorkbenchPage>;
}
export type WorkbenchFailure = {
  kind: "authentication" | "permission" | "scope" | "scopeTooLarge" | "unavailable" | "error";
  requestId: string | null;
};
export type WorkbenchDrillState = {
  kind: WorkbenchKind; page: WorkbenchPage | null; loading: boolean;
  error: WorkbenchFailure | null; requestCursor: string | null;
};
export type WorkbenchState = {
  key: string; snapshot: WorkbenchSnapshot | null; loading: boolean;
  error: WorkbenchFailure | null; drill: WorkbenchDrillState | null;
};

export const workbenchKey = (query: WorkbenchScope & WorkbenchFilters) => JSON.stringify([
  query.workspaceId, query.projectId ?? null, query.environmentId, query.buildReference,
]);
