import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import {
  mapRevisionSummary, mapTestCase, mapTestCaseSummary,
} from "../data/test-case-mapper";

type Api = components["schemas"];
const timestamps = { createdAt: "2026-08-28T00:00:00Z", updatedAt: "2026-08-28T00:00:01Z" };

test("maps bounded case summaries without fabricating revision content", () => {
  const dto: Api["TestCaseSummary"] = {
    id: "case-1", projectId: "project-1", key: "UH-TC-1", folderPath: "/Smoke",
    currentRevision: 3, title: "Sign in", type: "manual", lifecycle: "ready",
    priority: "critical", component: "Auth", ownerIdentityId: null,
    tags: ["smoke"], estimatedMinutes: 5, revisionCount: 3, archivedAt: null,
    etag: '"case-1:3"',
    ...timestamps,
  };
  assert.deepEqual(mapTestCaseSummary(dto), dto);
  assert.equal("steps" in mapTestCaseSummary(dto), false);
});

test("maps full case detail with case links and immutable current revision", () => {
  const current: Api["TestCaseRevision"] = {
    revision: 3, title: "Sign in", description: "Account access", preconditions: "User exists",
    type: "manual", lifecycle: "ready", priority: "critical", component: "Auth",
    ownerIdentityId: null, tags: ["smoke"], estimatedMinutes: 5, testData: "qa@example.test",
    steps: [{ id: "step-1", order: 1, action: "Sign in", expectedResult: "Home opens", required: true, attachmentIds: ["att-step"] }],
    checklist: [], attachmentIds: ["att-revision"], changeNote: "Clarify result",
    createdBy: "identity-1", createdAt: timestamps.createdAt,
  };
  const detail = mapTestCase({
    id: "case-1", projectId: "project-1", key: "UH-TC-1", folderPath: "/Smoke",
    currentRevision: 3, current, revisionCount: 3, linkIds: ["link-1"],
    archivedAt: null, ...timestamps,
  });
  assert.notEqual(detail.current, current);
  assert.equal(detail.current.title, "Sign in");
  assert.deepEqual(detail.current.attachmentIds, ["att-revision"]);
  assert.deepEqual(detail.linkIds, ["link-1"]);
});

test("keeps revision history summaries lightweight", () => {
  const dto: Api["TestCaseRevisionSummary"] = {
    revision: 2, title: "Sign in", type: "manual", lifecycle: "ready",
    priority: "high", component: "Auth", ownerIdentityId: "identity-1",
    estimatedMinutes: 4, changeNote: "Updated", createdBy: "identity-1",
    createdAt: timestamps.createdAt,
  };
  const summary = mapRevisionSummary(dto);
  assert.equal(summary.revision, 2);
  assert.equal("steps" in summary, false);
});
