import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import {
  bulkFailureInvalidatesSelection,
  reconcileCaseSummaries,
  shouldRefreshAfterBulkFailure,
} from "./reconcileCaseSummaries";

const summary = (id: string): TestCaseSummary => ({
  id,
  projectId: "project-1",
  key: `P-${id}`,
  folderPath: "/",
  currentRevision: 1,
  title: "Case",
  type: "manual",
  lifecycle: "draft",
  priority: "low",
  component: "Core",
  ownerIdentityId: null,
  tags: [],
  estimatedMinutes: null,
  revisionCount: 1,
  archivedAt: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  etag: '"case:1"',
});

test("bulk reconciliation updates concurrency fields without leaking transport flags", () => {
  const untouched = summary("case-2");
  const result = reconcileCaseSummaries([summary("case-1"), untouched], [{
    id: "case-1",
    key: "P-case-1",
    currentRevision: 2,
    lifecycle: "ready",
    priority: "critical",
    updatedAt: "2026-09-01T01:00:00Z",
    etag: '"case-1:2"',
    changed: true,
  }]);

  assert.equal(result[0]?.currentRevision, 2);
  assert.equal(result[0]?.revisionCount, 2);
  assert.equal(result[0]?.lifecycle, "ready");
  assert.equal(result[0]?.priority, "critical");
  assert.equal(result[0]?.etag, '"case-1:2"');
  assert.equal("changed" in result[0]!, false);
  assert.equal(result[1], untouched);
});

test("bulk recovery refreshes every response that can invalidate the selected scope", () => {
  assert.equal(shouldRefreshAfterBulkFailure("PRECONDITION_FAILED"), true);
  assert.equal(shouldRefreshAfterBulkFailure("NOT_FOUND"), true);
  assert.equal(shouldRefreshAfterBulkFailure("CONFLICT"), true);
  assert.equal(shouldRefreshAfterBulkFailure("BAD_REQUEST"), false);
  assert.equal(shouldRefreshAfterBulkFailure(null), false);
  assert.equal(bulkFailureInvalidatesSelection("NOT_FOUND"), true);
  assert.equal(bulkFailureInvalidatesSelection("CONFLICT"), true);
  assert.equal(bulkFailureInvalidatesSelection("PRECONDITION_FAILED"), false);
});

test("bulk lifecycle updates preserve automated type and arbitrary tags", () => {
  const automated = {
    ...summary("automated"),
    type: "automated" as const,
    tags: ["smoke", "ci.backend", "owner-team-a"],
  };
  const [result] = reconcileCaseSummaries([automated], [{
    id: automated.id,
    key: automated.key,
    currentRevision: 2,
    lifecycle: "ready",
    priority: "high",
    updatedAt: "2026-09-01T01:00:00Z",
    etag: '"automated:2"',
    changed: true,
  }]);
  assert.equal(result?.type, "automated");
  assert.deepEqual(result?.tags, ["smoke", "ci.backend", "owner-team-a"]);
});
