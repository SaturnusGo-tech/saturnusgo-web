import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import { browserHarness, elements } from "../../../presentation/cases/browser/tests/browser-harness";
import type { FolderActionsDialog } from "../../presentation/actions/FolderActionsDialog";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import type { FolderNode } from "../../model/tree";

test("New subfolder closes the action menu and enters inline creation for that folder", () => {
  const app = browserHarness(), h = componentHarness(); app.props.selectedCaseId = "profile-case";
  const branches = () => elements(app.renderTree(), node => node.type === "RepositoryFolderBranch");
  const parent = branches().find(node => (node.props.node as FolderNode).folder.id === "pay")!;
  const folder = (parent.props.node as FolderNode).folder;
  (parent.props.onMenu as (item: typeof folder) => void)(folder);
  const menu = elements(app.renderTree(), node => node.type === "FolderActionsDialog")[0]; assert.ok(menu);
  const component = h.load<{ FolderActionsDialog: typeof FolderActionsDialog }>(new URL("../../presentation/actions/FolderActionsDialog.tsx", import.meta.url)).FolderActionsDialog;
  const render = () => nodes(h.render(() => component(menu.props as never)));
  const create = render().find(node => node.type === "button" && (node.props.children as unknown[])?.includes("New subfolder")); assert.ok(create);
  invoke(create, "onClick");
  assert.equal(elements(app.renderTree(), node => node.type === "FolderActionsDialog").length, 0);
  assert.equal((branches()[0].props.creation as RepositoryCreation).activeFolderId, folder.id);
  assert.equal(app.props.selectedCaseId, "profile-case");
  assert.equal(render().some(node => node.type === "FolderDialog"), false);
  app.dispose();
});

test("unavailable or busy inline creation cannot close the menu or start a draft", () => {
  for (const busy of [false, true]) {
    const h = componentHarness(); let called = 0;
    const component = h.load<{ FolderActionsDialog: typeof FolderActionsDialog }>(new URL("../../presentation/actions/FolderActionsDialog.tsx", import.meta.url)).FolderActionsDialog;
    const folder: RepositoryFolder = { name: "Web", id: "web", path: "/Web", parentId: null,
      workspaceId: "workspace", projectId: "project", appearance: null, archivedAt: null, rowVersion: 1,
      createdAt: "2026-11-04T00:00:00Z", updatedAt: "2026-11-04T00:00:00Z", etag: '"web:v1"' };
    const resource: FolderResource = { items: [folder], busy, loading: false, canManage: true, error: "", reload() {},
      create: async () => null, update: async () => false, archive: async () => false, restore: async () => false,
      moveCases: async () => ({ ok: false, message: "Unavailable" }), archiveCases: async () => ({ ok: false, message: "Unavailable" }) };
    const content = h.render(() => component({ folder, resource, ru: false, onClose: () => { called++; },
      onCreateCase() {}, onCreateFolder: busy ? () => { called++; } : undefined }));
    const create = nodes(content).find(node => node.type === "button" && (node.props.children as unknown[])?.includes("New subfolder")); assert.ok(create);
    assert.equal(create.props.disabled, true); invoke(create, "onClick"); assert.equal(called, 0);
  }
});

test("New folder opens the structure screen and leaves selection untouched", () => {
  const app = browserHarness(); let opened = 0; app.props.onNewFolder = () => { opened++; };
  app.props.selectedCaseId = "profile-case"; app.props.selectedFolderId = "pay";
  const create = elements(app.renderTree(), item => item.props["aria-label"] === "New folder")[0];
  (create.props.onClick as () => void)();
  assert.equal(opened, 1); assert.equal(app.props.selectedCaseId, "profile-case");
  assert.equal(elements(app.renderTree(), item => item.type === "InlineFolderForm").length, 0);
  app.dispose();
});

test("Name and location closes the only menu and opens architecture for that folder", () => {
  const app = browserHarness(), h = componentHarness();
  const opened: string[] = []; app.props.onManageFolder = id => { opened.push(id); };
  app.props.selectedCaseId = "profile-case";
  const branch = elements(app.renderTree(), node => node.type === "RepositoryFolderBranch")[0];
  const folder = (branch.props.node as FolderNode).folder;
  (branch.props.onMenu as (item: typeof folder) => void)(folder);
  const menu = elements(app.renderTree(), node => node.type === "FolderActionsDialog")[0]; assert.ok(menu);
  const component = h.load<{ FolderActionsDialog: typeof FolderActionsDialog }>(new URL("../../presentation/actions/FolderActionsDialog.tsx", import.meta.url)).FolderActionsDialog;
  const content = () => nodes(h.render(() => component(menu.props as never)));
  const edit = content().find(node => node.type === "button" && (node.props.children as unknown[])?.includes("Name and location")); assert.ok(edit);
  invoke(edit, "onClick");
  assert.deepEqual(opened, [folder.id]);
  assert.equal(elements(app.renderTree(), node => node.type === "FolderActionsDialog").length, 0);
  assert.equal(content().some(node => node.type === "FolderDialog"), false);
  assert.equal(app.props.selectedCaseId, "profile-case");
  app.dispose();
});
