import assert from "node:assert/strict";
import test from "node:test";
import type { FolderNode } from "../../model/tree";
import { defaultFolderExpansion, resolveFolderExpansion } from "../../model/expansion/default-expansion";
function folder(id: string, direct: boolean, children: FolderNode[] = []): FolderNode {
  return { folder: { id }, children, cases: direct ? [{ id: `${id}-case` }] : [], caseIds: [...(direct ? [`${id}-case`] : []), ...children.flatMap((child) => child.caseIds)], selectableCaseIds: [] } as unknown as FolderNode;
}
test("four nested folders reveal exactly three ancestor levels, leaving case contents closed", () => {
  const tree = folder("one", false, [folder("two", false, [folder("three", false, [folder("four", true)])])]);
  assert.deepEqual([...defaultFolderExpansion([tree])], ["one", "two", "three"]);
});
test("each branch stops at its first direct cases and empty branches remain closed", () => {
  const roots = [folder("mixed", true, [folder("child", false, [folder("deep", true)])]), folder("empty", false, [folder("empty-child", false)]), folder("other", false, [folder("leaf", true)])];
  assert.deepEqual([...defaultFolderExpansion(roots)], ["other"]);
});
test("manual collapse wins over computed expansion after reload and manual opening reveals a case folder", () => {
  const defaults = new Set(["one", "two", "three"]);
  const overrides = new Map([["two", false], ["four", true]]);
  assert.deepEqual([...resolveFolderExpansion(defaults, overrides, new Set())].sort(), ["four", "one", "three"]);
  assert.equal(resolveFolderExpansion(new Set(defaults), overrides, new Set(["two"])).has("two"), false);
});
test("deep link reveal opens a case-bearing folder without changing default expansion", () => {
  const defaults = defaultFolderExpansion([folder("leaf", true)]);
  assert.equal(defaults.size, 0);
  assert.equal(resolveFolderExpansion(defaults, new Map(), new Set(["leaf"])).has("leaf"), true);
});
