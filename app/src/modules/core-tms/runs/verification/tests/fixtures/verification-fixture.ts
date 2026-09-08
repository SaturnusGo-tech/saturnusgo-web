import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { VerificationEntry, VerificationQueueEnvelope, VerificationRunRequest } from "../../model/verification";

export const request: VerificationRunRequest = { scopeToken: "a".repeat(64), environmentId: "env-1", build: "build-42", name: "Fix verification" };
export const entry: VerificationEntry = { defectId: "bug-1", defectKey: "BUG-1", defectTitle: "Checkout fails",
  defectVersion: 2, readyAt: "2026-09-08T12:00:00Z", occurrenceId: "occurrence-1", caseId: "case-1",
  caseKey: "TC-1", caseTitle: "Complete checkout", caseRevision: 3, stepId: "step-1", stepAction: "Pay",
  blockedReason: null };
export const queue: VerificationQueueEnvelope = { data: { scopeToken: request.scopeToken, totalCases: 70,
  totalDefects: 80, blockedEntries: 10, entries: [entry] }, meta: { offset: 0, limit: 50, hasMore: false, nextOffset: null } };
const time = "2026-09-08T12:00:00Z";
export const run: components["schemas"]["Run"] = {
  id: "run-1", projectId: "project-1", key: "TR-1", name: request.name, description: "", type: "regression", status: "active",
  environment: { id: request.environmentId, key: "QA", name: "QA", baseUrl: "https://example.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: request.build, configuration: { fixVerificationScope: request.scopeToken },
  itemCount: 1, progress: { total: 1, executed: 0, percent: 0,
    counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: time, completedAt: null,
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null, archiveReason: null, createdAt: time, updatedAt: time,
};
