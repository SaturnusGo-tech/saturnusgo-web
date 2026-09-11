import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../model/folder";
import { buildFolderTree } from "../../model/tree";
import { elements, treeControl } from "./tree-control-harness";

const folder = { id: "archived-folder", name: "Новые сценарии", path: "/Новые сценарии", parentId: null, archivedAt: "2026-09-09" } as RepositoryFolder;
const cases = [1, 2, 3].map((id) => ({ id: `case-${id}`, key: `PAY-${id}`, title: `Case ${id}`, folderId: folder.id, folderPath: folder.path,
  archivedAt: folder.archivedAt }) as TestCaseSummary);

test("archived branches show real case counts and permit opening while drag and selection stay disabled", () => {
  const control = treeControl("branch/RepositoryFolderBranch.tsx", "RepositoryFolderBranch");
  const opened: unknown[][] = [];
  const node = buildFolderTree([folder], cases, true).roots[0];
  const result = control.render({ node, depth: 0, ru: true, locked: false, canManage: true,
    expanded: new Set([folder.id]), selected: new Set(), onFolder: (...args: unknown[]) => opened.push(args) });
  assert.deepEqual(elements(result, "small").map((item) => item.props.children), [3]);
  assert.equal(elements(result, "CaseLeaf").length, 3);
  const open = elements(result, "button").find((item) => elements(item, "span").some((label) => label.props.children === folder.name));
  assert.ok(open, "The archived folder remains reachable by its visible name");
  assert.equal(open.props.disabled, false);
  assert.equal(open.props["aria-disabled"], undefined);
  (open.props.onClick as () => void)();
  assert.deepEqual(opened, [[folder.path, folder.id]]);
  assert.equal(elements(result, "input")[0].props.disabled, true);
  assert.deepEqual(control.dragStates, [true]);
  assert.deepEqual(control.dropStates, [true]);
  assert.equal(buildFolderTree([folder], cases).roots.length, 0);
});

test("archived case leaves open the canonical case callback without enabling mutation controls", () => {
  const control = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf");
  const opened: unknown[] = [];
  const result = control.render({ item: cases[0], depth: 1, selected: false, active: false,
    locked: false, canManage: true, ru: true, onOpen: (item: unknown) => opened.push(item) });
  const open = elements(result, "button")[0];
  assert.equal(open.props.disabled, false);
  assert.equal(open.props["aria-disabled"], undefined);
  (open.props.onClick as () => void)();
  assert.equal(opened[0], cases[0]);
  assert.deepEqual(control.dragStates, [true]);
  assert.equal(elements(result, "input")[0].props.disabled, true);
});

test("read-only users may browse active cases while an open editor still locks navigation", () => {
  for (const locked of [false, true]) {
    const control = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf");
    let opens = 0;
    const result = control.render({ item: { ...cases[0], archivedAt: null }, depth: 0, selected: false,
      active: false, locked, canManage: false, ru: false, onOpen: () => opens++ });
    const open = elements(result, "button")[0];
    assert.equal(open.props.disabled, locked);
    assert.equal(open.props["aria-disabled"], locked || undefined);
    (open.props.onClick as () => void)();
    assert.equal(opens, locked ? 0 : 1);
    assert.equal(elements(result, "input")[0].props.disabled, true);
  }
});


test("run archive selection is explicit and does not enable dragging or bypass a locked view", () => {
  for (const allowArchivedSelection of [false, true]) for (const locked of [false, true]) {
    const control = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf");
    const toggled: string[] = [];
    const result = control.render({ item: cases[0], depth: 1, selected: false, active: false,
      locked, canManage: false, canSelect: true, allowArchivedSelection, ru: true,
      onToggle: (id: string) => toggled.push(id) });
    const checkbox = elements(result, "input")[0];
    assert.equal(checkbox.props.disabled, locked || !allowArchivedSelection);
    if (!checkbox.props.disabled) {
      (checkbox.props.onChange as () => void)();
      assert.deepEqual(toggled, [cases[0].id]);
    }
    assert.deepEqual(control.dragStates, [true]);
  }
});
