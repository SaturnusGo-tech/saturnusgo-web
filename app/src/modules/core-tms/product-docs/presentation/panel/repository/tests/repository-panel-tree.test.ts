import assert from "node:assert/strict";
import test from "node:test";
import type { RepositoryFolder } from "../../../../../folders/model/folder";
import { repositoryPanelAncestors } from "../repository-panel-tree";

function folder(id: string, parentId: string | null): RepositoryFolder {
  return { id, parentId } as RepositoryFolder;
}

test("revealing a deep folder expands its actual ancestors, not similarly named paths", () => {
  const folders = [folder("orders", null), folder("matching", "orders"), folder("timeouts", "matching"),
    folder("other-matching", null)];
  assert.deepEqual([...repositoryPanelAncestors(folders, "timeouts")], ["timeouts", "matching", "orders"]);
});

test("malformed or missing ancestors cannot trap repository navigation in a cycle", () => {
  assert.deepEqual([...repositoryPanelAncestors([folder("one", "two"), folder("two", "one")], "one")], ["one", "two"]);
  assert.deepEqual([...repositoryPanelAncestors([folder("one", "missing")], "one")], ["one"]);
  assert.deepEqual([...repositoryPanelAncestors([folder("one", null)], "absent")], []);
});
