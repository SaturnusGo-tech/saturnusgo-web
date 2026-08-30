import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { flattenCaseGroups, sortCaseRows } from "../caseListModel";

function createCase(index: number, priority: "low" | "medium" | "high" | "critical" = "medium"): TestCaseSummary {
  const folderPath = `/Folder ${Math.floor(index / 60) + 1}`;
  return {
    id: `case-${index}`,
    projectId: "project-1",
    key: `TMS-${index}`,
    folderPath,
    currentRevision: 1,
    title: `Case ${index}`,
    type: "manual",
    lifecycle: index % 2 === 0 ? "ready" : "draft",
    priority,
    component: index % 2 === 0 ? "Web" : "API",
    ownerIdentityId: "QA",
    tags: [],
    estimatedMinutes: index,
    revisionCount: 1,
    archivedAt: null,
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
  };
}

test("flattens every loaded repository group without truncating 240 cases", () => {
  const cases = Array.from({ length: 240 }, (_, index) => createCase(index + 1));
  const groups: Array<[string, TestCaseSummary[]]> = Array.from({ length: 4 }, (_, index) => [
    `/Folder ${index + 1}`,
    cases.slice(index * 60, index * 60 + 60),
  ]);
  const rows = flattenCaseGroups(groups);
  assert.equal(rows.length, 240);
  assert.equal(new Set(rows.map((row) => row.testCase.id)).size, 240);
});

test("sorts case keys naturally instead of lexicographically", () => {
  const rows = flattenCaseGroups([["/Folder", [createCase(10), createCase(2), createCase(1)]]]);
  const sorted = sortCaseRows(rows, { key: "key", direction: "asc" }, "en-US");
  assert.deepEqual(sorted.map((row) => row.testCase.key), ["TMS-1", "TMS-2", "TMS-10"]);
});

test("supports descending priority sorting", () => {
  const rows = flattenCaseGroups([["/Folder", [
    createCase(1, "low"),
    createCase(2, "critical"),
    createCase(3, "high"),
  ]]]);
  const sorted = sortCaseRows(rows, { key: "priority", direction: "desc" }, "en-US");
  assert.deepEqual(sorted.map((row) => row.testCase.priority), ["critical", "high", "low"]);
});
