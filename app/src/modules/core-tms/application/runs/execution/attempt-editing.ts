import type { RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";

export function canEditRunAttempt(run: TestRunSummary | null, item: RunItem | null) {
  if (!run || !item || run.archivedAt || run.status !== "active") return false;
  const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo);
  return Boolean(attempt && ["not_run", "in_progress"].includes(attempt.status)
    && ["not_run", "in_progress"].includes(item.status));
}
