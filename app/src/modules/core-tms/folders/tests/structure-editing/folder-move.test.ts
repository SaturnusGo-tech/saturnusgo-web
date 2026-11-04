import assert from "node:assert/strict";
import test from "node:test";
import { folderMovePlan, selectionRoots } from "../../model/structure/folder-move";
import type { RepositoryFolder } from "../../model/folder";

function folder(id: string, parentId: string | null = null, archivedAt: string | null = null): RepositoryFolder {
  return { id, parentId, path: `/${id}`, name: id, archivedAt } as RepositoryFolder;
}
const folders = [folder("api"), folder("auth", "api"), folder("child", "auth"), folder("web"), folder("archived", null, "today")];

test("bulk folder selection moves selected ancestors once and preserves their children", () => {
  assert.deepEqual(selectionRoots(new Set(["api", "auth", "child", "web", "archived"]), folders).map(item => item.id), ["api", "web"]);
});

test("batch destination rejects self, descendant, archived and missing folders even with stale paths", () => {
  for (const destination of ["api", "auth", "child", "archived", "missing"]) {
    assert.equal(folderMovePlan(new Set(["api", "web"]), destination, folders).valid, false, String(destination));
  }
});

test("root destination skips folders already in root and still moves other selected folders", () => {
  const plan = folderMovePlan(new Set(["auth", "web"]), null, folders);
  assert.equal(plan.valid, true);
  assert.deepEqual(plan.folders.map(item => item.id), ["auth"]);
  assert.equal(folderMovePlan(new Set(["api", "web"]), null, folders).valid, false);
});

test("archived or stale selection cannot silently become a different bulk action", () => {
  assert.equal(folderMovePlan(new Set(["missing", "web"]), "auth", folders).valid, false);
  assert.equal(folderMovePlan(new Set(["archived"]), null, folders).valid, false);
});
