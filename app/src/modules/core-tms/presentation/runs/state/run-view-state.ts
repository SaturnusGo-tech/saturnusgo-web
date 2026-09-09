import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";

type Run = Pick<TestRunSummary, "id" | "archivedAt"> | null;
export type RunListMode = "active" | "archived";
export type RunListSelection = { runId: string | null; archived: boolean; mode: RunListMode };

export function runListSelection(run: Run, mode?: RunListMode): RunListSelection {
  return { runId: run?.id ?? null, archived: Boolean(run?.archivedAt),
    mode: mode ?? (run?.archivedAt ? "archived" : "active") };
}

export function resolveRunListMode(selection: RunListSelection, run: Run): RunListMode {
  if (selection.runId !== (run?.id ?? null) || selection.archived !== Boolean(run?.archivedAt)) {
    return run?.archivedAt ? "archived" : "active";
  }
  return selection.mode;
}

export function runScopeState(loading: boolean, itemCount: number) {
  if (loading) return "loading";
  return itemCount === 0 ? "empty" : "ready";
}
