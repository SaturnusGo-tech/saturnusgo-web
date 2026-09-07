import type { RunItem, TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { mapRunItem } from "../../../../runs/data/run-mapper";
import { input } from "../../start/fixtures/start-fixture";

export const time = "2026-09-07T00:00:00Z";
export const run: TestRunSummary = { ...input.run, status: "active", startedAt: time };
export function item(): RunItem {
  const value = mapRunItem({
    id: "item-1", caseId: "case-1", caseKey: "QA-TC-1", revision: 1,
    assigneeIdentityId: null, status: "in_progress", attemptCount: 2, activeAttemptNo: 2,
    createdAt: time, updatedAt: time,
    snapshot: { revision: 1, title: "Verify immutable source", description: "", preconditions: "",
      type: "manual", lifecycle: "ready", priority: "high", component: "GitHub",
      ownerIdentityId: null, tags: [], estimatedMinutes: null, testData: "",
      steps: [{ id: "step-1", order: 1, action: "Inspect source", expectedResult: "SHA matches", required: true, attachmentIds: [], sharedStepId: null, sharedStep: null }],
      checklist: [], attachmentIds: [], changeNote: "Created", createdBy: "identity-1", createdAt: time },
    activeAttempt: { attemptNo: 2, status: "in_progress", actualResult: "", comment: "",
      blockedReason: "", attachmentIds: [], startedAt: time, completedAt: null,
      createdAt: time, updatedAt: time, stepResults: [{ stepId: "step-1", status: "passed",
        actualResult: "", comment: "", attachmentIds: [], updatedAt: time }] },
  });
  value.attempts.push({ ...structuredClone(value.attempts[0]!), attemptNo: 1,
    status: "failed", completedAt: time, actualResult: "Original failed result" });
  return value;
}
export function response(body: Record<string, unknown>, version = 2, attemptNo = 2) {
  return new Response(JSON.stringify({ data: { runId: run.id, runItemId: "item-1",
    attemptNo, result: { stepId: "step-1", ...body, attachmentIds: [], updatedAt: time } } }),
  { status: 200, headers: { etag: `"item-1:${version}"` } });
}
