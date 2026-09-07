import type { ExecutionStatus, RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { updateRunStep } from "../../../runs/data/run-api";
import { canEditRunAttempt } from "../execution/attempt-editing";

export function stepMutationEvidence(status: ExecutionStatus,
  current: { actualResult: string; comment: string } | undefined,
  defaults: { failure: string; blocked: string }) {
  return {
    actualResult: status === "failed" ? current?.actualResult || defaults.failure : current?.actualResult ?? "",
    comment: status === "blocked" ? current?.comment || defaults.blocked : current?.comment ?? "",
  };
}

export function createRunStepWriter(http: TmsHttpClient,
  createKey: () => string = () => crypto.randomUUID()) {
  const operations = new Map<string, PendingOperation>();
  return Object.freeze({
    async write(input: { run: TestRunSummary; resource: { data: RunItem; etag: string | null };
      stepId: string; status: ExecutionStatus; actualResult?: string;
      defaults: { failure: string; blocked: string } }) {
      const { run, resource, stepId, status, actualResult, defaults } = input;
      if (!resource.etag || !canEditRunAttempt(run, resource.data)) throw new Error("Attempt is read-only.");
      const attempt = resource.data.attempts.find((entry) => entry.attemptNo === resource.data.activeAttemptNo)!;
      const result = attempt.stepResults.find((entry) => entry.stepId === stepId);
      if (!result || status === "not_run") throw new Error("Step is not editable.");
      const evidence = stepMutationEvidence(status, result, defaults);
      if (actualResult !== undefined) evidence.actualResult = actualResult.trim();
      if (status === "failed" && !evidence.actualResult && !evidence.comment.trim()) {
        throw new Error("A failed step needs an actual result or comment.");
      }
      const target = JSON.stringify([run.id, resource.data.id, attempt.attemptNo, stepId]);
      const operation = resolvePendingOperation(operations.get(target) ?? null,
        JSON.stringify({ target, status, evidence, etag: resource.etag }), createKey);
      operations.set(target, operation);
      const saved = await updateRunStep(http, run.id, resource.data.id, stepId,
        { status, ...evidence }, resource.data, resource.etag, operation.key);
      if (operations.get(target) === operation) operations.delete(target);
      return saved;
    },
  });
}
