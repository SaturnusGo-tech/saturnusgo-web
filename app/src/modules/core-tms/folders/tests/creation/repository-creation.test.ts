import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import type { RepositoryFolder } from "../../model/folder";
import { buildFolderTree } from "../../model/tree";
import { elements, treeControl } from "../archive/tree-control-harness";
import { browserHarness, elements as find } from "../../../presentation/cases/browser/tests/browser-harness";

const folder = { id: "parent", name: "API", path: "/API", parentId: null, archivedAt: null } as RepositoryFolder;
const item = { id: "case", key: "QA-1", title: "Get profile", folderId: "parent", folderPath: "/API", archivedAt: null } as TestCaseSummary;
const creation: RepositoryCreation = { activeFolderId: null, begin() {}, close() {}, async create() { return null; }, created() {}, createCase() {} };

test("creation targets the hovered folder ID and the hovered case's folder, independent of selected folder", () => {
  const branch = treeControl("branch/RepositoryFolderBranch.tsx", "RepositoryFolderBranch");
  const tree = branch.render({ node: buildFolderTree([folder], [item]).roots[0], depth: 0,
    selected: new Set(), expanded: new Set([folder.id]), selectedFolder: "/Elsewhere", canManage: true, locked: false, ru: true, creation });
  assert.deepEqual({ ...(elements(tree, "RepositoryQuickAdd")[0].props.target as object) }, { kind: "folder", id: folder.id, name: folder.name });
  const leaf = elements(tree, "CaseLeaf")[0]; assert.equal(leaf.props.creation, creation);
  const caseTree = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf").render(leaf.props);
  assert.equal(elements(caseTree, "CaseQuickAdd")[0].props.folderPath, "/API");
  assert.equal(elements(caseTree, "CaseQuickAdd")[0].props.onCreate, creation.createCase);
});

test("read-only and archived rows never expose creation; selection trees need explicit opt-in", () => {
  for (const canManage of [false, true]) for (const archived of [false, true]) for (const enabled of [false, true]) {
    const current = { ...item, archivedAt: archived ? "2026-09-22" : null };
    const row = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf").render({ item: current,
      canManage, creation: enabled ? creation : undefined, selected: false, locked: false });
    assert.equal(elements(row, "CaseQuickAdd").length, canManage && !archived && enabled ? 1 : 0);
  }
});

test("unfiled case creation explicitly targets root and locked rows disable the action", () => {
  const row = treeControl("case/RepositoryCaseLeaf.tsx", "RepositoryCaseLeaf").render({ item: { ...item, folderPath: "/", folderId: null },
    canManage: true, creation, selected: false, locked: true });
  const action = elements(row, "CaseQuickAdd")[0];
  assert.equal(action.props.folderPath, "/"); assert.equal(action.props.disabled, true);
});

test("a newly created subfolder remains visible under a search filter and its collapsed parent opens", () => {
  const app = browserHarness(); app.props.query = "transfer";
  const getBranches = () => find(app.renderTree(), node => node.type === "RepositoryFolderBranch");
  const root = getBranches()[0]; (root.props.onExpand as (id: string) => void)("pay");
  const actions = getBranches()[0].props.creation as RepositoryCreation;
  const added = { id: "created", name: "New", parentId: "pay", path: "/Payments/New", archivedAt: null } as RepositoryFolder;
  app.props.folders!.items = [...app.props.folders!.items, added]; actions.created(added);
  const after = getBranches()[0];
  assert.ok((after.props.expanded as Set<string>).has("pay"));
  assert.ok((after.props.node as ReturnType<typeof buildFolderTree>["roots"][number]).children.some(node => node.folder.id === "created"));
  app.dispose();
});
