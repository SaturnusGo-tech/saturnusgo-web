import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, nodes, invoke } from "../../../portfolios/tests/support/component-harness";
import type { CaseDetailHeaderActions } from "../../../presentation/cases/detail/header/CaseDetailHeaderActions";
import type { WorkspaceExecutionDialogs } from "../../../presentation/workspace-dialogs/WorkspaceExecutionDialogs";

test("native case menu dispatches bug creation and protects archived or edited cases", () => {
  const h = componentHarness();
  const { CaseDetailHeaderActions: View } = h.load<{ CaseDetailHeaderActions: typeof CaseDetailHeaderActions }>(
    new URL("../../../presentation/cases/detail/header/CaseDetailHeaderActions.tsx", import.meta.url));
  let opened = 0;
  const props = { locale: "ru", creating: false, editorOpen: false, fullscreen: false,
    testCase: { id: "case", projectId: "project", key: "TC-1", archivedAt: null },
    onRunCase() {}, onToggleFullscreen() {}, onClone() {}, onArchive() {}, onCreateDefect: () => { opened++; } };
  const render = () => nodes(h.render(() => View(props as never)));
  let all = render();
  let menu = all.find(n => n.type === "DropdownMenu")!;
  const items = all.filter(n => n.type === "DropdownItem");
  assert.deepEqual(items.map(n => n.key), ["key", "link", "clone", "defect", "quarantine"]);
  assert.equal(items.find(n => n.key === "defect")?.props.textValue, "Завести баг-репорт");
  assert.notEqual(menu.props.closeOnSelect, false);
  invoke(menu, "onAction", "defect"); assert.equal(opened, 1);
  Object.assign(props.testCase, { archivedAt: "2026-09-20T00:00:00Z" });
  menu = render().find(n => n.type === "DropdownMenu")!;
  assert.ok((menu.props.disabledKeys as string[]).includes("defect"));
  invoke(menu, "onAction", "defect"); assert.equal(opened, 1);
  Object.assign(props.testCase, { archivedAt: null });
  props.editorOpen = true; all = render();
  assert.equal(all.find(n => n.type === "Button" && n.props["aria-label"] === "Другие действия")?.props.isDisabled, true);
  invoke(all.find(n => n.type === "DropdownMenu")!, "onAction", "defect"); assert.equal(opened, 1);
  Object.assign(props, { editorOpen: false, onCreateDefect: undefined });
  assert.equal(render().some(n => n.type === "DropdownItem" && n.key === "defect"), false);
  props.creating = true;
  assert.equal(render().some(n => n.type === "DropdownMenu"), false);
  h.dispose();
});

test("case defect uses the captured project and never inherits a selected run", () => {
  const h = componentHarness();
  const { WorkspaceExecutionDialogs: View } = h.load<{ WorkspaceExecutionDialogs: typeof WorkspaceExecutionDialogs }>(
    new URL("../../../presentation/workspace-dialogs/WorkspaceExecutionDialogs.tsx", import.meta.url),
    name => name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "ru", t: (s: string) => s }) } : undefined);
  const source = { workspaceId: "w", testCase: { id: "case", projectId: "source-project" }, revision: {} };
  let refreshed = 0, closed = false;
  let data = { workspace: { id: "w" }, testCases: [{ projectId: "source-project", component: "Orders" },
    { projectId: "other", component: "Wrong" }], defects: [] as unknown[] };
  const model = { dialog: "case-defect", caseDefectSource: source, data, project: { id: "other" },
    view: "runs", selectedRun: { id: "stale-run" }, selectedRunItem: { id: "stale-item" }, connection: "connected",
    closeResourceEditors() {}, setDialog: () => { closed = true; }, notify() {},
    setData: (change: (value: typeof data) => typeof data) => { data = change(data); },
    caseCollaboration: { refreshDefects: () => { refreshed++; } } };
  const node = h.render(() => View({ model } as never))!;
  assert.equal(node.props.projectId, "source-project"); assert.equal(node.props.sourceCase, source);
  assert.equal(node.props.run, null); assert.equal(node.props.item, null);
  assert.deepEqual(Array.from(node.props.components), ["Orders"]);
  node.props.onCreated({ id: "defect" });
  assert.equal(data.defects.length, 1); assert.equal(closed, true); assert.equal(refreshed, 1);
  model.caseDefectSource = { ...source, workspaceId: "another-workspace" };
  assert.equal(h.render(() => View({ model } as never)), null);
  h.dispose();
});
