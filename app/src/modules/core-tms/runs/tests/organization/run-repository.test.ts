import test from "node:test";
import assert from "node:assert/strict";
import type { RunItemSummary } from "../../../../../core/tms/contracts/execution-contract";
import { runRepositoryEntries, runRepositoryFolders } from "../../batches/model/repository/run-repository";
import { runRepositoryGroups } from "../../batches/model/repository/run-repository-groups";
import { buildFolderTree } from "../../../folders/model/tree";

const item: RunItemSummary = { id: "item", caseId: "source-case", caseKey: "TC-1", revision: 1,
  status: "not_run", attemptCount: 1, activeAttemptNo: 1, assigneeIdentityId: null, createdAt: "", updatedAt: "",
  archivedAt: "2026-09-12T00:00:00Z", preview: { title: "Case", type: "manual", lifecycle: "ready",
    priority: "low", component: "API / Auth", tags: ["smoke", "smoke", "api"], folderPath: "/Moved", estimatedMinutes: null } };
const projected = runRepositoryEntries("run", "project", [item])[0].testCase;

test("run organization projection keeps archived cases reachable without making repository cases selectable", () => {
  const folders = runRepositoryFolders("workspace", "project", [projected]);
  assert.equal(projected.id, "item");
  assert.equal(projected.priority, "low");
  assert.deepEqual(buildFolderTree(folders, [projected]).roots[0].caseIds, []);
  const archived = buildFolderTree(folders, [projected], false, true).roots[0];
  assert.deepEqual(archived.caseIds, ["item"]);
  assert.deepEqual(archived.selectableCaseIds, []);
  assert.deepEqual(archived.cases[0], projected);
});
test("project grouping uses identities even when two projects share a display name", () => {
  const cases = [projected, { ...projected, id: "other-item", projectId: "other" }];
  const groups = runRepositoryGroups(cases, ["project"], [{ id: "project", name: "Same" }, { id: "other", name: "Same" }], true);
  assert.equal(groups.length, 2);
  assert.notEqual(groups[0].id, groups[1].id);
  assert.ok(groups.every(group => group.cases.length === 1));
});
test("combined grouping deduplicates repeated tags and retains one item identity across groups", () => {
  const groups = runRepositoryGroups([projected], ["project", "component", "tag"], [], true);
  assert.equal(groups.length, 2);
  assert.equal(new Set(groups.map(group => group.id)).size, 2);
  assert.deepEqual(groups.flatMap(group => group.cases.map(entry => entry.id)), ["item", "item"]);
  assert.equal(runRepositoryGroups([projected], [], [], true).length, 1);
});
