import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../model/folder";
import { buildFolderTree } from "../../model/tree";
import type { FolderBranchProps } from "../../presentation/branch/RepositoryFolderBranch";
import { elements, treeControl } from "../archive/tree-control-harness";

const root = { id: "root-folder", name: "Платежи", path: "/Платежи", parentId: null, archivedAt: null } as RepositoryFolder;
const child = { ...root, id: "child-folder", name: "Карты", path: "/Платежи/Карты", parentId: root.id };
const direct = { id: "case-direct", key: "PAY-1", title: "Перевод", folderId: root.id, folderPath: root.path, archivedAt: null, etag: '"case-direct:1"' } as TestCaseSummary;
const nested = { ...direct, id: "case-nested", key: "PAY-2", folderId: child.id, folderPath: child.path };

function branch(overrides: Partial<FolderBranchProps> = {}) {
  const calls: unknown[][] = [];
  const props: FolderBranchProps = {
    node: buildFolderTree([root, child], [direct, nested]).roots[0],
    depth: 0, expanded: new Set([root.id]), selected: new Set([nested.id]),
    selectedFolder: root.path, selectedFolderId: root.id, activeCaseId: direct.id,
    ru: true, locked: false, canManage: true,
    onExpand: (id) => calls.push(["expand", id]),
    onFolder: (...args) => calls.push(["folder", ...args]),
    onCase: (item) => calls.push(["case", item]),
    onToggle: (id) => calls.push(["toggle", id]),
    onScope: (ids) => calls.push(["scope", ...ids]),
    onMenu: (folder) => calls.push(["menu", folder.id]),
    ...overrides,
  };
  const control = treeControl("branch/RepositoryFolderBranch.tsx", "RepositoryFolderBranch");
  return { props, calls, control, result: control.render(props) };
}

function guide(result: unknown) {
  const button = elements(result, "button").find((item) => item.props.className === "branchGuide");
  assert.ok(button, "An expanded branch has a keyboard-accessible collapse guide");
  return button;
}

test("branch guide collapses only its own branch and preserves case selection/navigation", () => {
  const view = branch();
  const button = guide(view.result);
  assert.equal(button.props.type, "button");
  assert.equal(button.props["aria-label"], `Свернуть ветку ${root.name}`);
  assert.equal(String(button.props["aria-expanded"]), "true");
  assert.equal(button.props["aria-controls"], `repository-children-${root.id}`);
  assert.ok(!button.props.disabled);
  const children = elements(view.result, "ul").find((item) => item.props.id === button.props["aria-controls"]);
  assert.ok(children, "The guide controls the actual nested children list");
  const disclosure = elements(view.result, "button").find((item) => item.props.className === "disclosure");
  assert.ok(disclosure, "A persistent disclosure receives focus before its guide disappears");
  const disclosureRef = disclosure.props.ref as { current: { focus: () => void } | null };
  disclosureRef.current = { focus: () => { view.calls.push(["focus", root.id]); } };
  (button.props.onClick as () => void)();
  assert.deepEqual(view.calls, [["focus", root.id], ["expand", root.id]]);
  assert.deepEqual([...view.props.selected], [nested.id]);
  assert.equal(view.props.selectedFolderId, root.id);
  assert.equal(view.props.activeCaseId, direct.id);
});

test("collapsed branches remove their guide and hidden descendants from the rendered tree", () => {
  const view = branch({ expanded: new Set() });
  assert.equal(elements(view.result, "button").some((item) => item.props.className === "branchGuide"), false);
  assert.equal(elements(view.result, "ul").length, 0);
  assert.equal(elements(view.result, "CaseLeaf").length, 0);
  const disclosure = elements(view.result, "button").find((item) => item.props["aria-expanded"] === false);
  assert.ok(disclosure, "The collapsed folder remains expandable");
  (disclosure.props.onClick as () => void)();
  assert.deepEqual(view.calls, [["expand", root.id]]);
});

test("archived branches and read-only users can collapse without enabling mutations", () => {
  for (const archived of [false, true]) {
    const folder = { ...root, archivedAt: archived ? "2026-09-09T10:00:00Z" : null };
    const item = { ...direct, archivedAt: folder.archivedAt };
    const view = branch({
      node: buildFolderTree([folder], [item], archived).roots[0],
      ru: false, canManage: false,
    });
    const button = guide(view.result);
    assert.equal(button.props["aria-label"], `Collapse branch ${folder.name}`);
    assert.ok(!button.props.disabled);
    (button.props.onClick as () => void)();
    assert.deepEqual(view.calls, [["expand", folder.id]]);
    assert.equal(elements(view.result, "input")[0].props.disabled, true);
    assert.deepEqual(view.control.dragStates, [true]);
    assert.deepEqual(view.control.dropStates, [true]);
  }
});

test("branch checkbox selects direct and nested cases while preserving partial selection", () => {
  const view = branch();
  const checkbox = elements(view.result, "input")[0];
  assert.equal(checkbox.props.checked, false);
  assert.equal(checkbox.props.disabled, false);
  const input = { indeterminate: false };
  (checkbox.props.ref as (element: unknown) => void)(input);
  assert.equal(input.indeterminate, true);
  (checkbox.props.onChange as () => void)();
  assert.deepEqual(view.calls, [["scope", direct.id, nested.id]]);
  const all = branch({ selected: new Set([direct.id, nested.id]) });
  assert.equal(elements(all.result, "input")[0].props.checked, true);
});

test("nested leaf retains the canonical case opener and independent checkbox callback", () => {
  const view = branch();
  const childLeaf = elements(view.result, "CaseLeaf")[0];
  assert.equal(childLeaf.props.item, direct);
  assert.equal(childLeaf.props.onOpen, view.props.onCase);
  assert.equal(childLeaf.props.onToggle, view.props.onToggle);
  const control = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf");
  const result = control.render(childLeaf.props);
  const checkbox = elements(result, "input")[0];
  const open = elements(result, "button")[0];
  (checkbox.props.onChange as () => void)();
  assert.deepEqual(view.calls, [["toggle", direct.id]]);
  (open.props.onClick as () => void)();
  assert.deepEqual(view.calls, [["toggle", direct.id], ["case", direct]]);
  assert.deepEqual(control.dragStates, [false]);
});
