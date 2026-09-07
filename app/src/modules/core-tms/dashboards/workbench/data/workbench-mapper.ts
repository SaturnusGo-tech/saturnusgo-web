import type { components } from "../../../../../core/tms/generated/tms-api";
import type { DashboardDrillRow } from "../../model/dashboard-analytics";
import type { WorkbenchKind, WorkbenchQuery, WorkbenchQueue, WorkbenchRow, WorkbenchSnapshot } from "../model/workbench";
import { WorkbenchReadError } from "../model/workbench-error";

type Api = components["schemas"];
type RecordScope = { workspaceId: string; projectId: string; projectName: string; updatedAt: string;
  environmentId: string | null; buildReference: string | null };
const invalid = () => { throw new WorkbenchReadError({ kind: "error", requestId: null }); };
const dateValid = (value: string) => Number.isFinite(Date.parse(value));

function record(row: RecordScope, query: WorkbenchQuery, value: {
  id: string; key: string; title: string; entity: DashboardDrillRow["entity"]; status: string;
}): DashboardDrillRow {
  if (row.workspaceId !== query.workspaceId || !row.projectId ||
    (query.projectId && row.projectId !== query.projectId) || !dateValid(row.updatedAt) ||
    (query.environmentId && row.environmentId !== query.environmentId) ||
    (query.buildReference && row.buildReference !== query.buildReference) ||
    !value.id || typeof value.key !== "string" || typeof value.title !== "string") invalid();
  return { ...value, projectId: row.projectId, project: row.projectName,
    detail: "", occurredAt: row.updatedAt, links: [] };
}

const runRow = (run: Api["DashboardWorkbenchRun"], query: WorkbenchQuery): WorkbenchRow => ({
  navigation: { ...record(run, query, { id: run.id, key: run.key, title: run.name,
    entity: "run", status: run.status }), runId: run.id },
  environmentName: run.environmentName, buildReference: run.buildReference,
  updatedAt: run.updatedAt, progress: { ...run.progress },
});

const itemRow = (item: Api["DashboardWorkbenchItem"], query: WorkbenchQuery): WorkbenchRow => ({
  navigation: { ...record(item, query, { id: item.id, key: `${item.runKey} · ${item.caseKey}`,
    title: item.title, entity: "run_item", status: item.status }),
    runId: item.runId, runItemId: item.id, detail: item.runName },
  environmentName: item.environmentName, buildReference: item.buildReference,
  updatedAt: item.updatedAt, attemptNo: item.attemptNo,
  snapshotRevisionNo: item.snapshotRevisionNo, currentRevisionNo: item.currentRevisionNo,
});

const defectRow = (defect: Api["DashboardWorkbenchDefect"], query: WorkbenchQuery): WorkbenchRow => ({
  navigation: { ...record(defect, query, { id: defect.id, key: defect.key, title: defect.title,
    entity: "defect", status: defect.status }), priority: defect.priority,
    ...(defect.occurrence ? { runId: defect.occurrence.runId, runItemId: defect.occurrence.runItemId } : {}) },
  environmentName: defect.environmentName, buildReference: defect.buildReference,
  updatedAt: defect.updatedAt, ...(defect.occurrence ? { attemptNo: defect.occurrence.attemptNo } : {}),
});

function queue<T>(value: { items: T[]; total: number; truncated: boolean },
  query: WorkbenchQuery, map: (item: T, query: WorkbenchQuery) => WorkbenchRow): WorkbenchQueue {
  if (!Array.isArray(value.items) || value.items.length > query.limit ||
    !Number.isSafeInteger(value.total) || value.total < value.items.length) invalid();
  return { rows: value.items.map((item) => map(item, query)), total: value.total, truncated: value.truncated };
}

export function mapWorkbenchQueue(kind: WorkbenchKind, value: {
  items: Array<Api["DashboardWorkbenchRun"] | Api["DashboardWorkbenchItem"] | Api["DashboardWorkbenchDefect"]>;
  total: number; truncated: boolean;
}, query: WorkbenchQuery): WorkbenchQueue {
  if (kind === "activeRuns" || kind === "runsWithoutBuild") {
    if (value.items.some((row) => !("name" in row) || !("progress" in row))) invalid();
    return queue(value as Api["DashboardWorkbenchRuns"], query, runRow);
  }
  if (kind === "readyForRetest" || kind === "openDefects") {
    if (value.items.some((row) => !("occurrence" in row) || !("severity" in row))) invalid();
    return queue(value as Api["DashboardWorkbenchDefects"], query, defectRow);
  }
  if (value.items.some((row) => !("runId" in row) || !row.runId || !("testCaseId" in row) || !row.testCaseId)) invalid();
  return queue(value as Api["DashboardWorkbenchItems"], query, itemRow);
}

export function mapDashboardWorkbench(value: Api["DashboardWorkbench"], query: WorkbenchQuery): WorkbenchSnapshot {
  if (value.workspaceId !== query.workspaceId || value.projectId !== (query.projectId ?? null) ||
    value.filters.environmentId !== (query.environmentId || null) ||
    value.filters.buildReference !== (query.buildReference || null) ||
    !dateValid(value.generatedAt) || !dateValid(value.asOf)) invalid();
  if ([...Object.values(value.counts), ...Object.values(value.freshness)]
    .some((count) => !Number.isSafeInteger(count) || count < 0)) invalid();
  if (value.contextChoices.environments.items.some((item) =>
    query.projectId && item.projectId !== query.projectId)) invalid();
  return {
    scope: { workspaceId: value.workspaceId, ...(value.projectId ? { projectId: value.projectId } : {}) },
    filters: { environmentId: value.filters.environmentId ?? "", buildReference: value.filters.buildReference ?? "" },
    generatedAt: value.generatedAt, asOf: value.asOf,
    counts: { ...value.counts }, freshness: { ...value.freshness },
    queues: {
      activeRuns: mapWorkbenchQueue("activeRuns", value.activeRuns, query),
      readyForRetest: mapWorkbenchQueue("readyForRetest", value.readyForRetest, query),
      openDefects: mapWorkbenchQueue("openDefects", value.openDefects, query),
      blockedItems: mapWorkbenchQueue("blockedItems", value.blockedItems, query),
      notRunItems: mapWorkbenchQueue("notRunItems", value.notRunItems, query),
      inProgressItems: mapWorkbenchQueue("inProgressItems", value.inProgressItems, query),
      outdatedItems: mapWorkbenchQueue("outdatedItems", value.outdatedItems, query),
      runsWithoutBuild: mapWorkbenchQueue("runsWithoutBuild", value.runsWithoutBuild, query),
    },
    choices: {
      environments: value.contextChoices.environments.items.map((item) => ({ ...item })),
      builds: [...value.contextChoices.buildReferences.items],
      environmentsTruncated: value.contextChoices.environments.truncated,
      buildsTruncated: value.contextChoices.buildReferences.truncated,
    },
  };
}
