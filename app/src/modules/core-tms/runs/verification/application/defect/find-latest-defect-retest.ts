import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";

export async function findLatestDefectRetest(runs: readonly TestRunSummary[], projectId: string, defectId: string,
  readMembership: (runId: string) => Promise<ReadonlySet<string>>, signal?: AbortSignal) {
  const candidates = runs.filter(run => run.projectId === projectId && !run.archivedAt && run.configuration.fixVerificationScope)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  for (const run of candidates) {
    signal?.throwIfAborted();
    const members = await readMembership(run.id);
    signal?.throwIfAborted();
    if (members.has(defectId)) return run;
  }
  return null;
}
