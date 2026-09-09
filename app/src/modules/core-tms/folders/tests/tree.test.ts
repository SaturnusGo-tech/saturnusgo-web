import assert from "node:assert/strict";
import { test } from "node:test";
import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../model/folder";
import { repositoryScope } from "../model/selection/folder-scope";
import { buildFolderTree, dragCaseIds, validFolderDestinations } from "../model/tree";

const folder = (id: string, path: string, parentId: string | null = null, archivedAt: string | null = null): RepositoryFolder => ({
  id, path, parentId, archivedAt, name: path.split("/").slice(-1)[0], workspaceId: "workspace", projectId: "project", rowVersion: 1,
  createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z", etag: `"${id}:1"`,
});
const item = (id: string, folderId: string | null, folderPath: string, archivedAt: string | null = null): TestCaseSummary => ({
  id, key: `PAY-${id}`, title: id, folderId, folderPath, archivedAt, projectId: "project", currentRevision: 1, revisionCount: 1,
  type: "manual", lifecycle: "ready", priority: "medium", component: "payments", ownerIdentityId: null, tags: [],
  estimatedMinutes: null, createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z", etag: `"${id}:1"`,
});

test("tree preserves empty folders, case leaves and descendant selection scope after rename", () => {
  const folders = [folder("parent", "/Payments"), folder("child", "/Payments/Refunds", "parent"), folder("empty", "/Empty")];
  const tree = buildFolderTree(folders, [item("1", "child", "/Old/Refunds"), item("2", "parent", "/Payments"), item("3", null, "/")]);
  const parent = tree.roots.find((node) => node.folder.id === "parent")!;
  assert.deepEqual(parent.caseIds, ["2", "1"]);
  assert.equal(parent.children[0].cases[0].id, "1");
  assert.equal(tree.roots.find((node) => node.folder.id === "empty")!.caseIds.length, 0);
  assert.deepEqual(tree.unfiled.map((row) => row.id), ["3"]);
});

test("archive does not mix active cases with archived branches", () => {
  const folders = [folder("active", "/Payments"), folder("archived", "/Legacy", null, "2026-09-09T00:00:00Z")];
  const cases = [item("1", "active", "/Payments"), item("2", "archived", "/Legacy", "2026-09-09T00:00:00Z")];
  assert.deepEqual(buildFolderTree(folders, cases).roots.map((row) => row.folder.id), ["active"]);
  assert.deepEqual(buildFolderTree(folders, cases, true).roots[0].caseIds, ["2"]);
});

test("moving a selected case includes cross-folder selection; moving another case moves only it", () => {
  const selected = new Set(["payments-1", "profile-2", "payments-3"]);
  assert.deepEqual(dragCaseIds("profile-2", selected), [...selected]);
  assert.deepEqual(dragCaseIds("profile-4", selected), ["profile-4"]);
  assert.equal(selected.size, 3);
});

test("folder destinations exclude descendants without excluding similarly named sibling paths", () => {
  const moving = folder("one", "/Pay");
  const options = [moving, folder("child", "/Pay/Refund", "one"), folder("sibling", "/Payments"), folder("archived", "/Archive", null, "2026-09-09")];
  assert.deepEqual(validFolderDestinations(options, moving).map((row) => row.id), ["sibling"]);
});


test("folder selection distinguishes archived paths reused by active folders", () => {
  const folders = [folder("old", "/Pay", null, "2026-09-09"), folder("new", "/Pay"), folder("child", "/Pay/Refund", "old", "2026-09-09")];
  const scope = repositoryScope(folders, "old", "/Pay");
  assert.equal(scope.archived, true);
  assert.equal(scope.includes(item("a", "old", "/Pay", "2026-09-09")), true);
  assert.equal(scope.includes(item("b", "new", "/Pay")), false);
  assert.equal(scope.includes(item("c", "child", "/Pay/Refund", "2026-09-09")), true);
  assert.equal(repositoryScope(folders, "new", "/Pay").archived, false);
});


test("archived cases keep their original folder identity when paths are reused", () => {
  const folders = [folder("old", "/Pay", null, "2026-09-09"), folder("active", "/Pay")];
  const result = buildFolderTree(folders, [item("a", "active", "/Pay", "2026-09-09"), item("b", "old", "/Pay", "2026-09-09")], true);
  assert.deepEqual(result.roots[0].caseIds, ["b"]);
  assert.deepEqual(result.unfiled, []);
});
