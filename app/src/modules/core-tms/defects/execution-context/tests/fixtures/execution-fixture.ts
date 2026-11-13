import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";

type Api = components["schemas"];
const time = "2026-09-08T12:00:00Z";
export const defect: Defect = {
  id: "bug-1", projectId: "project-1", key: "BUG-1", title: "Checkout fails",
  description: "Observed checkout failure", preconditions: "", testData: "",
  severity: "high", priority: "high", status: "verified",
  reproducibility: "always", assigneeIdentityId: null, component: "Checkout", integrationTarget: null,
  externalIssue: null, labels: [], runId: "run-1", runItemId: "item-1", stepId: "step-2",
  expectedResult: "Payment succeeds", actualResult: "Payment fails", attachmentIds: [], linkIds: [], createdAt: time,
};
export const run: Api["Run"] = {
  rowVersion: 1, etag: '"run-1:1"', ownerIdentityId: null, tags: [],
  id: "run-1", projectId: "project-1", key: "TR-1", name: "Original archived run", description: "",
  type: "regression", status: "completed", elapsedMilliseconds: 0, activeSince: null, measuredAt: time,
  environment: { id: "env-original", key: "QA", name: "Original QA", baseUrl: "https://example.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: "original-build", configuration: {}, itemCount: 1,
  progress: { total: 1, executed: 1, percent: 100,
    counts: { not_run: 0, in_progress: 0, passed: 0, failed: 1, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: time, completedAt: time,
  abortedAt: null, abortReason: null, archivedAt: time, archivedBy: "identity-1", archiveReason: "Finished",
  createdAt: time, updatedAt: time,
};
export const item: Api["RunItem"] = {
  etag: '"item-1:1"', id: "item-1", caseId: "case-1", caseKey: "TC-1", revision: 2,
  assigneeIdentityId: null, status: "failed", attemptCount: 2, activeAttemptNo: 2, createdAt: time, updatedAt: time,
  snapshot: { customFields: [], productGroupId: null, productId: null, regression: false,
    revision: 2, title: "Immutable checkout title", description: "Original description", preconditions: "", type: "manual",
    lifecycle: "ready", priority: "high", component: "Checkout", ownerIdentityId: null, tags: [], estimatedMinutes: 2,
    testData: "", steps: [
      { id: "step-1", order: 1, action: "Open checkout", expectedResult: "Checkout opens", required: true,
        attachmentIds: [], sharedStepId: null },
      { id: "step-2", order: 2, action: "Pay from original snapshot", expectedResult: "Payment succeeds", required: true,
        attachmentIds: [], sharedStepId: null },
    ], checklist: [{ id: "check-1", order: 3, text: "Original confirmation", required: true }], attachmentIds: [],
    changeNote: "Original revision", createdBy: "identity-1", createdAt: time },
  activeAttempt: { rowVersion: 2, attemptNo: 2, status: "failed", actualResult: "Payment fails", comment: "",
    blockedReason: "", attachmentIds: [], startedAt: time, completedAt: time, createdAt: time, updatedAt: time,
    stepResults: [] },
};
