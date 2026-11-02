import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../../../folders/model/folder";
import { filterPickerCases, pickerFolders, pickerSelection } from "../picker-model";

const folder = (id: string, path: string, parentId: string | null = null, archivedAt: string | null = null) =>
  ({ id, name: path.split("/").pop(), path, parentId, archivedAt } as RepositoryFolder);
const item = (id: string, folderId: string | null, folderPath: string, extra = {}) =>
  ({ id, key: `QA-${id}`, title: `Check ${id}`, folderId, folderPath, tags: [], priority: "medium", component: "", archivedAt: null, ...extra } as unknown as TestCaseSummary);
const folders = [folder("host", "/Host"), folder("child", "/Host/Calendar", "host"), folder("hostile", "/Hostile")];
const cases = [item("a", "host", "/Host"), item("b", "child", "/Host/Calendar"), item("c", "hostile", "/Hostile"),
  item("legacy", null, "/Host/Calendar"), item("root", null, "/"), item("orphan", "missing", "/Host")];

test("folder browsing includes descendants and legacy paths without leaking similarly named folders", () => {
  const entries = pickerFolders(folders, cases);
  assert.deepEqual(entries.find(entry => entry.id === "host")?.caseIds, ["a", "b", "legacy"]);
  assert.deepEqual(filterPickerCases(cases, entries, { folder: "host", query: "", priority: "all" }).map(value => value.id), ["a", "b", "legacy"]);
  assert.equal(filterPickerCases(cases, entries, { folder: "", query: "", priority: "all" }).length, 6);
});
test("archived folder identities are not remapped to a new folder with the same path", () => {
  const entries = pickerFolders([folder("old", "/Host", null, "2026-10-01"), folder("new", "/Host")],
    [item("old-case", "old", "/Host"), item("legacy", null, "/Host")]);
  assert.deepEqual(entries.find(entry => entry.id === "new")?.caseIds, ["legacy"]);
});
test("search, priority and selected-only filters combine while preserving unloaded selections", () => {
  const selected = new Set(["hidden-unloaded", "a", "b"]);
  const source = [item("a", "host", "/Host", { title: "Sign in", priority: "high", tags: ["smoke"] }),
    item("b", "child", "/Host/Calendar", { title: "Sign out", priority: "low" })];
  const visible = filterPickerCases(source, pickerFolders(folders, source),
    { folder: "host", query: "SIGN smoke", priority: "high", selected });
  assert.deepEqual(visible.map(value => value.id), ["a"]);
  assert.deepEqual(pickerSelection(visible, selected), { ids: ["a"], all: true, partial: false });
  assert.deepEqual([...selected], ["hidden-unloaded", "a", "b"]);
});
test("selection state uses visible scope only and empty results cannot select anything", () => {
  assert.deepEqual(pickerSelection(cases.slice(0, 2), new Set(["hidden", "a"])), { ids: ["a", "b"], all: false, partial: true });
  assert.deepEqual(pickerSelection([], new Set(["hidden"])), { ids: [], all: false, partial: false });
  assert.equal(filterPickerCases([item("x", null, "/", { archivedAt: "2026-10-01" })], [],
    { folder: "", query: "", priority: "all" }).length, 0);
});
