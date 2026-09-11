import test from "node:test";
import assert from "node:assert/strict";
import { emptyRunFilters, matchesRunFilters, toggleRunFilter } from "../run-filter-model";
import { runRepositoryEntries } from "../../../../runs/batches/model/repository/run-repository";
import type { RunItemSummary } from "../../../../../../core/tms/contracts/execution-contract";

function row(projectId: string, owner: string | null, status: RunItemSummary["status"], folder = "/API", tags = ["smoke"]) {
  return runRepositoryEntries("run", projectId, [{ id: projectId + String(owner), caseId: "case", caseKey: "TC-1",
    revision: 1, assigneeIdentityId: owner, status, attemptCount: 1, activeAttemptNo: 1, createdAt: "", updatedAt: "",
    preview: { title: "Case", type: "manual", lifecycle: "ready", priority: "high", component: "api", tags,
      folderPath: folder, estimatedMinutes: null } }])[0];
}
const rows = [row("one", "anna", "passed"), row("two", "boris", "passed"),
  row("two", "anna", "failed", "/UI", ["regression"]), row("three", null, "not_run", "/API/Auth")];

test("multiple values form a union within each filter and intersect across filters", () => {
  const filters = { ...emptyRunFilters(), owners: ["anna", "boris"], projects: ["one", "two"], results: ["passed", "failed"] };
  assert.deepEqual(rows.filter(r => matchesRunFilters(r, filters)), rows.slice(0, 3));
  assert.deepEqual(rows.filter(r => matchesRunFilters(r, { ...filters, results: ["passed"] })), rows.slice(0, 2));
});
test("unassigned can be combined with named members; empty filters include everyone", () => {
  assert.deepEqual(rows.filter(r => matchesRunFilters(r, { ...emptyRunFilters(), owners: ["anna", "unassigned"] })), [rows[0], rows[2], rows[3]]);
  assert.equal(rows.filter(r => matchesRunFilters(r, emptyRunFilters())).length, 4);
});
test("folders include descendants without matching a sibling prefix; tags use any selected tag", () => {
  assert.deepEqual(rows.filter(r => matchesRunFilters(r, { ...emptyRunFilters(), folders: ["/API", "/UI"], tags: ["smoke", "regression"] })), rows);
  assert.equal(matchesRunFilters(row("one", null, "passed", "/API-other"), { ...emptyRunFilters(), folders: ["/API"] }), false);
  assert.equal(matchesRunFilters(rows[0], { ...emptyRunFilters(), tags: ["missing", "smoke"] }), true);
});
test("type, priority, lifecycle and component retain all selected values", () => {
  const filters = { ...emptyRunFilters(), types: ["manual", "automated"], priorities: ["high", "low"], statuses: ["draft", "ready"], components: ["api", "mobile"] };
  assert.ok(matchesRunFilters(rows[0], filters));
  for (const field of ["types", "priorities", "statuses", "components"] as const)
    assert.equal(matchesRunFilters(rows[0], { ...filters, [field]: ["missing"] }), false);
});
test("toggle removes only the selected value and All resets restrictions", () => {
  assert.deepEqual(toggleRunFilter(["a"], "b"), ["a", "b"]);
  assert.deepEqual(toggleRunFilter(["a", "b"], "a"), ["b"]);
  assert.deepEqual(toggleRunFilter(["a"], "a"), []);
  assert.deepEqual(toggleRunFilter(["a", "b"], "all"), []);
});
