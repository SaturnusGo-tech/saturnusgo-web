import type { ExecutionStatus } from "../../../../core/tms/contracts/legacy-contract";

export const statusLabel: Record<ExecutionStatus, string> = {
  not_run: "Not run",
  in_progress: "In progress",
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
  skipped: "Skipped",
};
