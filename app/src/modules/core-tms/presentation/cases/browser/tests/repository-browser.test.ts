import assert from "node:assert/strict";
import test from "node:test";
import type { FolderNode } from "../../../../folders/model/tree";
import { browserHarness, elements } from "./browser-harness";

const branches = (value: unknown) => elements(value, (item) => item.type === "RepositoryFolderBranch");
const nodes = (value: unknown) => branches(value).map((item) => item.props.node as FolderNode);

test("repository replaces the duplicate table, preserves empty folders and begins without auto-selecting a case", () => {
  const app = browserHarness();
  assert.equal(elements(app.renderList(), (item) => item.type === "CasesTable").length, 0);
  assert.equal(elements(app.renderList(), (item) => item.type === "RepositoryFolders").length, 1);
  assert.equal(app.render().inspectorOpen, false); assert.equal(app.props.selectedCaseId, "");
  assert.ok(nodes(app.renderTree()).some((node) => node.folder.id === "empty"));
  app.dispose();
});

test("text and QL filters prune unrelated branches while preserving and expanding matching ancestors", () => {
  const app = browserHarness(); app.props.query = "transfer";
  app.render().setQlQuery("priority:high -title:obsolete");
  const tree = app.renderTree();
  assert.deepEqual(nodes(tree).map((node) => node.folder.id), ["pay"]);
  const root = branches(tree)[0]; const node = root.props.node as FolderNode;
  assert.equal(node.children[0].folder.id, "transfer"); assert.deepEqual(node.caseIds, ["transfer-case"]);
  assert.deepEqual([...root.props.expanded as Set<string>].filter((id) => ["pay", "transfer"].includes(id)).sort(), ["pay", "transfer"]);
  app.props.query = "no matches anywhere";
  assert.equal(nodes(app.renderTree()).length, 0);
  assert.ok(elements(app.renderTree(), (item) => item.type === "li").some((item) => String(item.props.children).includes("No matching")));
  app.dispose();
});

test("archive toggle applies the same query independently without losing archived cases behind an active folder scope", () => {
  const app = browserHarness(); app.props.query = "transfer";
  app.render().setQlQuery("priority:high");
  const initial = app.renderTree();
  const archive = elements(initial, (item) => item.props["aria-label"] === "Show archived folders")[0];
  (archive.props.onClick as () => void)();
  const archived = nodes(app.renderTree());
  assert.deepEqual(archived.map((node) => node.folder.id), ["archive"]);
  assert.deepEqual(archived[0].caseIds, ["old-case"]); assert.deepEqual(archived[0].selectableCaseIds, []);
  assert.equal(app.render().selectableVisibleCount, 0);
  app.render().bulkSelection.selectVisible();
  assert.deepEqual(app.render().bulkSelection.selectedIds, [], "archive must never select hidden active cases");
  app.dispose();
});

test("include-archived reveals individual archived cases and archived folders without making them bulk-selectable", () => {
  const app = browserHarness(); app.props.filters = { ...app.props.filters, includeArchived: true };
  const mixed = nodes(app.renderTree());
  assert.deepEqual(mixed.flatMap((node) => node.caseIds).sort(), app.items.map((item) => item.id).sort());
  assert.deepEqual(mixed.flatMap((node) => node.selectableCaseIds).sort(), ["profile-case", "transfer-case"]);
  app.render().bulkSelection.selectAll();
  assert.deepEqual(app.render().bulkSelection.selectedIds.sort(), ["profile-case", "transfer-case"]);
  app.dispose();
});

test("cross-folder selection survives filters and folder changes; server archiving removes only the archived selection", () => {
  const app = browserHarness();
  app.render().bulkSelection.toggleOne("transfer-case"); app.render().bulkSelection.toggleOne("profile-case");
  app.props.query = "transfer"; app.props.selectedFolder = "/Payments/Transfers"; app.props.selectedFolderId = "transfer";
  assert.deepEqual(app.render().bulkSelection.selectedIds.sort(), ["profile-case", "transfer-case"]);
  assert.equal(app.render().bulkSelection.visibleCoverage, "all");
  app.props.testCases = app.props.testCases.map((item) => item.id === "profile-case" ? { ...item, archivedAt: "2026-09-09" } : item);
  assert.deepEqual(app.render().bulkSelection.selectedIds, ["transfer-case"]);
  app.dispose();
});

test("the permanent detail pane shows an empty state until selection and uses the same canonical editor", () => {
  const app = browserHarness();
  let result = app.renderView();
  assert.equal(elements(result, (item) => item.type === "aside" && item.props.id === "case-detail-panel").length, 1);
  assert.equal(elements(result, (item) => item.type === "CaseBrowserEmpty").length, 1);
  assert.equal(elements(result, (item) => item.type === "CaseDetailPanel").length, 0);
  app.props.onSelectCase("transfer-case");
  app.props.revision = { title: "Transfer accounts" } as typeof app.props.revision;
  result = app.renderView();
  const detail = elements(result, (item) => item.type === "CaseDetailPanel")[0];
  assert.equal(detail.props.testCase, app.props.testCase); assert.equal(detail.props.revision, app.props.revision);
  (detail.props.onClose as () => void)();
  assert.equal(elements(app.renderView(), (item) => item.type === "CaseBrowserEmpty").length, 1);
  app.props.editor = { mode: "create", value: { title: "New transfer" }, onCancel() {} } as typeof app.props.editor;
  const editor = elements(app.renderView(), (item) => item.type === "CaseDetailPanel")[0];
  assert.equal(editor.props.editor, app.props.editor); assert.equal(editor.props.revision, app.props.editor?.value);
  assert.equal(elements(app.renderView(), (item) => item.type === "CaseBrowserEmpty").length, 0);
  app.dispose();
});


test("explicit creation targets the requested active folder even when an archived folder is selected", () => {
  const app = browserHarness(); const paths: string[] = []; app.props.onNew = (path) => paths.push(path ?? "");
  app.props.selectedFolder = "/Old"; app.props.selectedFolderId = "archive";
  app.render().createCase(); assert.deepEqual(paths, [], "the selected archived folder remains read-only");
  app.render().createCase("/Payments/Transfers"); assert.deepEqual(paths, ["/Payments/Transfers"]);
  app.render().createCase("/Old"); assert.equal(paths.length, 1, "an archived destination cannot create an active case");
  app.dispose();
});
test("case selection replaces the durable folder context even when its path was reused", () => {
  const app = browserHarness(); app.props.selectedFolder = "/Payments/Transfers"; app.props.selectedFolderId = "old-transfer-folder";
  app.render().selectRow({ testCase: app.items[0], folderPath: app.items[0].folderPath });
  assert.equal(app.props.selectedFolderId, "transfer"); assert.equal(app.props.selectedCaseId, "transfer-case"); app.dispose();
});
