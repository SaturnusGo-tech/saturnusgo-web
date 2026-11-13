import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../../../folders/model/folder";
import { filterCaseRows } from "../../../../../../presentation/cases/model/caseListModel";
import { relatedCaseView, RELATED_UNFILED } from "../related-case-view";

const folder = (id: string, path: string, parentId: string | null = null, archivedAt: string | null = null) =>
  ({ id, name: path.split("/").pop(), path, parentId, archivedAt } as RepositoryFolder);
const item = (id: string, folderId: string | null, folderPath: string, extra = {}) =>
  ({ id, key: `QA-${id}`, title: `Check ${id}`, projectId: "p", folderId, folderPath, tags: [], lifecycle: "ready",
    priority: "high", type: "manual", component: "API", archivedAt: null, ownerIdentityId: null, currentRevision: 1,
    estimatedMinutes: null, revisionCount: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01", etag: '"1"', ...extra } as TestCaseSummary);
const folders = [folder("orders", "/Orders"), folder("matching", "/Orders/Matching", "orders"),
  folder("refund", "/Orders/Refunds", "orders"), folder("calendar", "/Calendar"), folder("empty", "/Empty")];
const cases = [item("1", "matching", "/Orders/Matching", { title: "Find executor", tags: ["smoke"] }),
  item("2", "refund", "/Orders/Refunds", { title: "Refund payment" }), item("3", "calendar", "/Calendar"), item("4", null, "/")];
const project = (matching: TestCaseSummary[], extra = {}) => relatedCaseView({ folders, cases: matching, folder: "", selected: new Set<string>(),
  selectedOnly: false, prune: true, includeArchived: false, ...extra });

test("search and QL prune unrelated branches while preserving ancestors and exact matching counts", () => {
  for (const query of [{ titleQuery: "executor" }, { qlQuery: 'tag = "smoke"' }, { facets: { folders: [], components: ["API"], owners: ["qa"] } }]) {
    const source = query.facets ? cases.map(value => ({ ...value, ownerIdentityId: value.id === "1" ? "qa" : null })) : cases;
    const matched = filterCaseRows(source.map(testCase => ({ testCase, folderPath: testCase.folderPath })), query).map(row => row.testCase);
    const view = project(matched);
    assert.deepEqual(view.folders.map(value => [value.id, value.caseIds.length]), [["orders", 1], ["matching", 1]]);
    assert.equal(view.folders[0].hasChildren, true);
    assert.equal(view.folders[1].hasChildren, false);
    assert.deepEqual(view.visible.map(value => value.id), ["1"]);
    assert.equal(view.total, 1);
  }
});

test("the current folder still scopes an empty result and never falls back to unrelated matches", () => {
  const view = project([cases[0]], { folder: "refund" });
  assert.equal(view.current?.id, "refund");
  assert.deepEqual(view.visible, []);
  assert.deepEqual(view.folders.map(value => value.id), ["orders", "matching"]);
});

test("selected-only prunes folders without dropping hidden selection IDs and resets when selection becomes empty", () => {
  const selected = new Set(["1", "unloaded"]);
  const view = project(cases, { selected, selectedOnly: true });
  assert.deepEqual(view.visible.map(value => value.id), ["1"]);
  assert.deepEqual(view.folders.map(value => value.id), ["orders", "matching"]);
  assert.deepEqual([...selected], ["1", "unloaded"]);
  assert.equal(project(cases, { selected: new Set(), selectedOnly: true }).visible.length, cases.length);
});

test("no-filter browsing retains empty folders and unfiled cases while archived identities stay distinct", () => {
  const view = project(cases, { prune: false });
  assert.ok(view.folders.some(value => value.id === "empty"));
  assert.deepEqual(view.folders.find(value => value.id === RELATED_UNFILED)?.caseIds, ["4"]);
  const archived = folder("old", "/Calendar", null, "2026-01-01");
  const archiveView = project([item("5", "old", "/Calendar", { archivedAt: "2026-01-01" })], {
    folders: [...folders, archived], includeArchived: true,
  });
  assert.deepEqual(archiveView.folders.map(value => value.id), ["old"]);
  assert.deepEqual(archiveView.visible.map(value => value.id), ["5"]);
});

test("zero matches produces an empty tree and All cases count zero", () => {
  const view = project([]);
  assert.equal(view.total, 0);
  assert.deepEqual(view.folders, []);
  assert.deepEqual(view.visible, []);
});
