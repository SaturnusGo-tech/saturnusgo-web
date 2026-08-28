import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { mapRun, mapRunAttemptSummary, mapRunItem } from "../data/run-mapper";

type Api = components["schemas"];
const time = "2026-08-28T00:00:00Z";
const progress: Api["RunProgress"] = {
  total: 1, executed: 0, percent: 0,
  counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 },
};

test("maps server-owned run progress without embedded items", () => {
  const dto: Api["Run"] = {
    id: "run-1", projectId: "project-1", key: "UH-TR-1", name: "Smoke",
    description: "Release smoke", type: "smoke", status: "active",
    environment: { id: "env-1", key: "LOCAL", name: "Local", baseUrl: "https://example.test", variableKeys: [] },
    suiteId: null, suiteResolutionId: null, build: "42", configuration: {}, itemCount: 1,
    progress, attachmentIds: [], createdBy: "identity-1", startedAt: time,
    completedAt: null, abortedAt: null, abortReason: "", createdAt: time, updatedAt: time,
  };
  const run = mapRun(dto);
  assert.notEqual(run.progress, dto.progress);
  assert.equal(run.progress.counts.not_run, 1);
  assert.equal("items" in run, false);
});

test("maps one selected item detail and keeps attempt history summary bounded", () => {
  const attempt: Api["RunAttempt"] = {
    attemptNo: 1, status: "not_run", actualResult: "", comment: "", blockedReason: "",
    attachmentIds: [], startedAt: time, completedAt: null, createdAt: time, updatedAt: time,
    stepResults: [{ stepId: "step-1", status: "not_run", actualResult: "", comment: "", attachmentIds: [], updatedAt: time }],
  };
  const item = mapRunItem({
    id: "item-1", caseId: "case-1", caseKey: "UH-TC-1", revision: 2,
    assigneeIdentityId: null, status: "not_run", attemptCount: 1, activeAttemptNo: 1,
    createdAt: time, updatedAt: time,
    snapshot: {
      revision: 2, title: "Sign in", description: "", preconditions: "", type: "manual",
      lifecycle: "ready", priority: "high", component: "Auth", ownerIdentityId: null,
      tags: [], estimatedMinutes: 2, testData: "", steps: [], checklist: [], attachmentIds: [],
      changeNote: "Created", createdBy: "identity-1", createdAt: time,
    },
    activeAttempt: attempt,
  });
  assert.equal(item.attempts.length, 1);
  assert.equal(item.attempts[0]?.stepResults.length, 1);
  const summary = mapRunAttemptSummary(attempt);
  assert.equal("stepResults" in summary, false);
});
