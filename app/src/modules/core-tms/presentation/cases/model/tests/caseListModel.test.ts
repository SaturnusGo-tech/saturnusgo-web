import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import {
  filterCaseRows,
  flattenCaseGroups,
  groupCaseRows,
  parseCaseQlQuery,
  sortCaseRows,
} from "../caseListModel";
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
    etag: `"case-${index}:1"`,
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

test("case listings keep priority as one sortable signal instead of a duplicate pill column", () => {
  const table = readFileSync(new URL("../../list/CasesTable.tsx", import.meta.url), "utf8");
  const signal = readFileSync(new URL("../../list/priority/PrioritySignal.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../../list/prioritySignal.module.css", import.meta.url), "utf8");
  const listingStyles = readFileSync(new URL("../../listing/caseListing.module.css", import.meta.url), "utf8");
  assert.match(table, /className=\{styles\.prioritySortButton\}/);
  assert.match(table, /<PrioritySignal priority=\{item\.priority\}/);
  assert.doesNotMatch(table, /<PriorityBadge/);
  assert.equal((table.match(/key: "priority"/g) ?? []).length, 1);
  assert.match(signal, /priority === "low" \? Diamond : Triangle/);
  assert.match(signal, /fill=\{filled \? "currentColor" : "none"\}/);
  assert.match(styles, /\.signal\[data-priority="high"\] \{ color: #e58b18; \}/);
  assert.match(styles, /\.signal\[data-priority="critical"\] \{ color: #e3404b; \}/);
  assert.match(listingStyles, /\.flagColumn \{ width: 32px; padding-inline: 0 !important; \}/);
  assert.match(listingStyles, /\.typeColumn \{ width: 36px; padding-inline: 0 !important; \}/);
  assert.match(listingStyles, /\.keyColumn \{ width: 90px; \}/);
  assert.match(listingStyles, /\.flagCell > svg \{ margin-inline: auto; \}/);
});

test("parses quoted QL values, aliases, and exclusions", () => {
  assert.deepEqual(parseCaseQlQuery('status:ready lifecycle:draft component:"Web client" -tag:flaky'), [
    { field: "lifecycle", value: "ready", exclude: false },
    { field: "lifecycle", value: "draft", exclude: false },
    { field: "component", value: "Web client", exclude: false },
    { field: "tag", value: "flaky", exclude: true },
  ]);
});

test("filters title separately and applies every QL predicate", () => {
  const api = { ...createCase(1, "critical"), title: "Create account", component: "API", tags: ["smoke"] };
  const web = { ...createCase(2, "high"), title: "Create profile", component: "Web", tags: ["regression"] };
  const rows = flattenCaseGroups([["/Accounts", [api, web]]]);
  assert.deepEqual(filterCaseRows(rows, { titleQuery: "create", qlQuery: "priority:critical tag:smoke" }).map((row) => row.testCase.id), ["case-1"]);
  assert.deepEqual(filterCaseRows(rows, { qlQuery: "component:web -tag:smoke" }).map((row) => row.testCase.id), ["case-2"]);
  assert.deepEqual(filterCaseRows(rows, { titleQuery: "accounts" }).map((row) => row.testCase.id), ["case-1", "case-2"]);
  assert.deepEqual(filterCaseRows(rows, { titleQuery: "regression" }).map((row) => row.testCase.id), ["case-2"]);
});

test("groups every visible row without losing real case identities", () => {
  const rows = flattenCaseGroups([["/A", [createCase(1), createCase(2)]], ["/B", [createCase(3)]]]);
  const groups = groupCaseRows(rows, "folder");
  assert.deepEqual(groups.map((group) => [group.value, group.rows.length]), [["/A", 2], ["/B", 1]]);
  assert.equal(new Set(groups.flatMap((group) => group.rows.map((row) => row.testCase.id))).size, 3);
});
