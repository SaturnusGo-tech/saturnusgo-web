import assert from "node:assert/strict";
import test from "node:test";
import {
  reconcileSelection,
  selectedIdsInOrder,
  selectionCoverage,
  setScopeSelected,
  toggleScopeSelection,
} from "./caseSelection";

test("selection coverage handles empty, partial, and complete scopes", () => {
  const selected = new Set(["case-1", "case-3"]);
  assert.equal(selectionCoverage(selected, []), "none");
  assert.equal(selectionCoverage(selected, ["case-2"]), "none");
  assert.equal(selectionCoverage(selected, ["case-1", "case-2"]), "some");
  assert.equal(selectionCoverage(selected, ["case-3", "case-1"]), "all");
});

test("scope updates preserve selections outside the current filter or group", () => {
  const hiddenSelection = new Set(["hidden-case"]);
  const selected = setScopeSelected(hiddenSelection, ["case-1", "case-2"], true);
  assert.deepEqual([...selected], ["hidden-case", "case-1", "case-2"]);
  assert.deepEqual(
    [...setScopeSelected(selected, ["case-1", "case-2"], false)],
    ["hidden-case"],
  );
});

test("toggle selects a partial group and clears a fully selected group", () => {
  const partial = new Set(["case-1", "outside"]);
  const all = toggleScopeSelection(partial, ["case-1", "case-2"]);
  assert.deepEqual([...all], ["case-1", "outside", "case-2"]);
  assert.deepEqual(
    [...toggleScopeSelection(all, ["case-1", "case-2"])],
    ["outside"],
  );
});

test("reconciliation removes deleted cases without reacting to filters", () => {
  const selected = new Set(["case-1", "case-2"]);
  assert.equal(reconcileSelection(selected, ["case-1", "case-2", "case-3"]), selected);
  assert.deepEqual([...reconcileSelection(selected, ["case-2", "case-3"])], ["case-2"]);
});

test("exact selected IDs follow authoritative project order", () => {
  const selected = new Set(["case-3", "case-1", "stale"]);
  assert.deepEqual(
    selectedIdsInOrder(selected, ["case-1", "case-2", "case-3", "case-3"]),
    ["case-1", "case-3"],
  );
});
