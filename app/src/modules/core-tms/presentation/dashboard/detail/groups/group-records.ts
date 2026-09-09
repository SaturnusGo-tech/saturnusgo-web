import type { Bootstrap } from "../../../../../../core/tms/contracts/legacy-contract";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { compactRunTitle } from "../../workbench/rows/title/compact-run-title";
export type RunGroup = { key: string; run: DashboardDrillRow; rows: DashboardDrillRow[] };
export function groupRunRecords(rows: DashboardDrillRow[], data: Bootstrap): RunGroup[] {
  const groups = new Map<string, RunGroup>();
  for (const row of rows) {
    const key = JSON.stringify([row.projectId, row.runId ?? row.id]);
    let group = groups.get(key);
    if (!group) {
      const known = data.runs.find(run => run.id === row.runId && run.projectId === row.projectId);
      const title = row.runName ?? known?.name ?? row.detail;
      group = { key, rows: [], run: { ...row, entity: "run", id: row.runId ?? row.id, runItemId: undefined,
        title: compactRunTitle(title, row.project, known?.build ?? null), key: known?.key ?? "",
        progress: known ? { total: known.progress.total, notRun: known.progress.counts.not_run, inProgress: known.progress.counts.in_progress,
          passed: known.progress.counts.passed, failed: known.progress.counts.failed, blocked: known.progress.counts.blocked, skipped: known.progress.counts.skipped } : undefined } };
      groups.set(key, group);
    }
    const testCase = data.testCases.find(item => item.projectId === row.projectId && item.id === row.testCaseId);
    group.rows.push({ ...row, component: row.component ?? testCase?.component, type: row.type ?? testCase?.type });
  }
  return [...groups.values()];
}
