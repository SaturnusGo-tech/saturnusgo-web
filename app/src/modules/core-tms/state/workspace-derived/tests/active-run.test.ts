import assert from "node:assert/strict";
import test from "node:test";
import { isAuthoritativelyActiveRun } from "../useWorkspaceDerived";

test("active-run badge ignores archived and terminal runs", () => {
  assert.equal(isAuthoritativelyActiveRun({ status: "active", archivedAt: null }), true);
  assert.equal(isAuthoritativelyActiveRun({ status: "active", archivedAt: "2026-09-01T00:00:00Z" }), false);
  assert.equal(isAuthoritativelyActiveRun({ status: "completed", archivedAt: null }), false);
  assert.equal(isAuthoritativelyActiveRun({ status: "aborted", archivedAt: null }), false);
});
