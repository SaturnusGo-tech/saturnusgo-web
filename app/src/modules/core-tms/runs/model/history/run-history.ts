import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";

type RunState = Pick<TestRunSummary, "status" | "archivedAt">;
export const isHistoricalRun = (run: RunState) => Boolean(run.archivedAt)
  || run.status === "completed" || run.status === "aborted";
export const isWorkingRun = (run: RunState) => !isHistoricalRun(run)
  && ["draft", "active", "paused"].includes(run.status);
export const isHistoricalRunChoice = (choice: { runs: RunState[] }) =>
  choice.runs.length > 0 && choice.runs.every(isHistoricalRun);

export function defaultWorkingRun(runs: TestRunSummary[], projectId?: string) {
  return runs.filter((run) => (!projectId || run.projectId === projectId) && isWorkingRun(run))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function nextRunAfterFinish(choices: { runs: TestRunSummary[] }[], updated: TestRunSummary[]) {
  const changes = new Map(updated.map((run) => [run.id, run]));
  return choices.flatMap((choice) => choice.runs.map((run) => changes.get(run.id) ?? run))
    .find(isWorkingRun) ?? null;
}
