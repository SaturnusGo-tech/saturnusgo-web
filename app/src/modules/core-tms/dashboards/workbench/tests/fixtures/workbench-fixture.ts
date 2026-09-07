import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { WorkbenchQuery } from "../../model/workbench";

type Api = components["schemas"];
export const workbenchQuery: WorkbenchQuery = {
  workspaceId: "workspace-a", projectId: "project-a", environmentId: "env-a", buildReference: "release/a + #7", limit: 20,
};

export function workbenchFixture(query: WorkbenchQuery = workbenchQuery): Api["DashboardWorkbench"] {
  const scope = { workspaceId: query.workspaceId, projectId: query.projectId ?? "project-a", projectName: "Project A" };
  const context = { environmentId: query.environmentId || "env-a", environmentName: "Staging",
    buildReference: query.buildReference || "release/a + #7" };
  const updatedAt = "2026-09-07T10:00:00.000Z";
  const run: Api["DashboardWorkbenchRun"] = { ...scope, ...context, id: "run-active", key: "QA-TR-1",
    name: "Active regression", status: "active", startedAt: updatedAt, updatedAt,
    progress: { total: 8, notRun: 2, inProgress: 1, passed: 3, failed: 1, blocked: 1, skipped: 0 } };
  const item: Api["DashboardWorkbenchItem"] = { ...scope, ...context, id: "item-active", runId: run.id,
    runKey: run.key, runName: run.name, testCaseId: "case-a", caseKey: "QA-TC-1", title: "Checkout",
    status: "blocked", attemptNo: 2, snapshotRevisionNo: 1, currentRevisionNo: 3, updatedAt };
  const defect: Api["DashboardWorkbenchDefect"] = { ...scope, ...context, id: "defect-a", key: "QA-BUG-1",
    title: "Checkout rejected", status: "ready_for_retest", severity: "critical", priority: "high", updatedAt,
    occurrence: { runId: "run-completed-source", runItemId: "item-failed-source", testCaseId: "case-a", attemptNo: 1, stepId: null } };
  return {
    workspaceId: query.workspaceId, projectId: query.projectId ?? null,
    generatedAt: updatedAt, asOf: updatedAt,
    filters: { environmentId: query.environmentId || null, buildReference: query.buildReference || null },
    basis: { scope: "active_projects_current_state", runs: "active_nonarchived_runs",
      defects: "nonarchived_not_verified_or_closed", context: "run_environment_and_build_defect_matching_occurrence",
      freshness: "snapshot_revision_differs_from_current_informational" },
    counts: { activeRuns: 23, readyForRetest: 1, blockedActiveItems: 1, openDefects: 2 },
    freshness: { notRunActiveItems: 2, inProgressActiveItems: 1, outdatedActiveItems: 1, activeRunsWithoutBuild: 0 },
    activeRuns: { items: [run], total: 23, truncated: true },
    readyForRetest: { items: [defect], total: 1, truncated: false },
    openDefects: { items: [defect, { ...defect, id: "defect-other", key: "QA-BUG-2", status: "open",
      ...(!query.environmentId && !query.buildReference
        ? { occurrence: null, environmentId: null, environmentName: null, buildReference: null } : {}) }], total: 2, truncated: false },
    blockedItems: { items: [item], total: 1, truncated: false },
    notRunItems: { items: [{ ...item, id: "item-waiting", status: "not_run" }], total: 2, truncated: true },
    inProgressItems: { items: [{ ...item, id: "item-progress", status: "in_progress" }], total: 1, truncated: false },
    outdatedItems: { items: [{ ...item, id: "item-older-snapshot", status: "passed" }], total: 1, truncated: false },
    runsWithoutBuild: { items: [], total: 0, truncated: false },
    contextChoices: { environments: { items: [{ projectId: scope.projectId, projectName: scope.projectName,
      id: "env-a", name: "Staging" }], total: 1, truncated: false },
    buildReferences: { items: [context.buildReference], total: 1, truncated: false } },
  };
}
