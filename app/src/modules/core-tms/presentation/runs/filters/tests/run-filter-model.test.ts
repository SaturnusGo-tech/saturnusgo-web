import test from "node:test";
import assert from "node:assert/strict";
import { matchesRunFilters } from "../run-filter-model";
const rows = [
  { projectId: "one", item: { status: "passed", assigneeIdentityId: "anna" } },
  { projectId: "two", item: { status: "passed", assigneeIdentityId: "boris" } },
  { projectId: "two", item: { status: "failed", assigneeIdentityId: "anna" } },
  { projectId: "three", item: { status: "passed", assigneeIdentityId: null } },
  { projectId: "three", item: { status: "not_run" } },
];
test("project, result and assignee conditions intersect", () => {
  assert.deepEqual(rows.filter((row) => matchesRunFilters(row, { projectIds: ["one", "two"], result: "passed", owner: "anna" })), [rows[0]]);
});
test("unassigned includes legacy entries without an identity", () => {
  assert.deepEqual(rows.filter((row) => matchesRunFilters(row, { projectIds: [], result: "all", owner: null })), [rows[3], rows[4]]);
});
test("all conditions restore every row; multiple projects use union", () => {
  assert.equal(rows.filter((row) => matchesRunFilters(row, { projectIds: [], result: "all", owner: undefined })).length, 5);
  assert.deepEqual(rows.filter((row) => matchesRunFilters(row, { projectIds: ["one", "two"], result: "all", owner: undefined })), rows.slice(0, 3));
});
