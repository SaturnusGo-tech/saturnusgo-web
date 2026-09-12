import assert from "node:assert/strict";
import test from "node:test";
import type { Suite, TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import { initialSuiteSelection, toggleSuiteScope } from "../suite-selection";
const item = (id: string, archivedAt: string | null = null) => ({ id, tags: ["smoke"], archivedAt } as TestCaseSummary);

test("editing static membership preserves selected cases absent from the hydrated catalog", () => {
  const suite = { type: "static", caseIds: ["a", "missing-page", "archived"], filter: {} } as Suite;
  assert.deepEqual(initialSuiteSelection(suite, [item("a"), item("archived", "2026-09-12")]), suite.caseIds);
});
test("folder and filtered select-all toggles only their exact scope and preserves hidden selections", () => {
  const initial = Object.freeze(["hidden", "selected"]);
  const added = toggleSuiteScope(initial, ["selected", "new"]);
  assert.deepEqual(added, ["hidden", "selected", "new"]);
  assert.deepEqual(toggleSuiteScope(added, ["selected", "new"]), ["hidden"]);
  assert.deepEqual(toggleSuiteScope(initial, []), initial);
  assert.deepEqual(initial, ["hidden", "selected"]);
});
test("default smoke suggestion excludes archives and duplicate scope IDs are never introduced", () => {
  assert.deepEqual(initialSuiteSelection(undefined, [item("a"), item("b", "2026-09-12")]), ["a"]);
  assert.deepEqual(toggleSuiteScope(["a"], ["b", "b"]), ["a", "b"]);
});
