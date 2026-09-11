import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
export type RunIteration = components["schemas"]["RunIteration"];
export type RunBatch = Omit<components["schemas"]["RunBatch"], "runs"> & {
  runs: Array<TestRunSummary & { rowVersion: number }>;
};
export type RunBatchRequest = components["schemas"]["RunBatchCreateRequest"];
export type RunBatchTransition = components["schemas"]["RunBatchTransitionRequest"];
