import assert from "node:assert/strict";
import test from "node:test";
import type { Suite, SuiteSummary } from "../../../../core/tms/contracts/legacy-contract";
import { resolvedRunSuiteCount } from "./useResolvedSuiteCount";

const summary: SuiteSummary = { id: "suite-1", projectId: "project-1", key: "HOST-TS-1", name: "Negative", description: "", type: "dynamic", caseCount: 0, status: "active", createdAt: "2026-08-29T00:00:00Z", updatedAt: "2026-08-29T00:00:00Z" };
const detail: Suite = { ...summary, caseIds: [], filter: { tags: ["negative"] }, resolvedCaseCount: 45 };

test("dynamic suites wait for the authoritative resolved count", () => {
  assert.equal(resolvedRunSuiteCount(summary, null), null);
  assert.equal(resolvedRunSuiteCount(summary, detail), 45);
});

test("static suites also use the authoritative resolved count", () => {
  const staticSummary = { ...summary, type: "static" as const, caseCount: 12 };
  assert.equal(resolvedRunSuiteCount(staticSummary, null), null);
  assert.equal(resolvedRunSuiteCount(staticSummary, { ...detail, type: "static", resolvedCaseCount: 10 }), 10);
});
