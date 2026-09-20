import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, nodes, invoke } from "../../../portfolios/tests/support/component-harness";
import type { CaseDetailHeaderActions } from "../../../presentation/cases/detail/header/CaseDetailHeaderActions";
import type { WorkspaceExecutionDialogs } from "../../../presentation/workspace-dialogs/WorkspaceExecutionDialogs";

test("case menu offers a fourth action, closes on selection and protects archived cases", () => {
  const h = componentHarness(undefined, { document: { addEventListener() {}, removeEventListener() {} } });
  const { CaseDetailHeaderActions: View } = h.load<{ CaseDetailHeaderActions: typeof CaseDetailHeaderActions }>(
    new URL("../../../presentation/cases/detail/header/CaseDetailHeaderActions.tsx", import.meta.url));
  let opened = 0;
  const props = { locale: "ru", creating: false, editorOpen: false, fullscreen: false,
    testCase: { id: "case", projectId: "project", key: "TC-1", archivedAt: null },
    onRunCase() {}, onToggleFullscreen() {}, onClone() {}, onArchive() {}, onCreateDefect: () => { opened++; } };
  const render = () => nodes(h.render(() => View(props as never)));
  invoke(render().find(n => n.props["aria-haspopup"] === "menu")!, "onClick");
  const items = render().filter(n => n.props.role === "menuitem");
  assert.equal(items.length, 4);
  assert.ok(JSON.stringify(items[3]).includes("Завести баг-репорт"));
  invoke(items[3], "onClick"); assert.equal(opened, 1);
  assert.equal(render().filter(n => n.props.role === "menuitem").length, 0);
  Object.assign(props.testCase, { archivedAt: "2026-09-20T00:00:00Z" });
  invoke(render().find(n => n.props["aria-haspopup"] === "menu")!, "onClick");
  const disabled = render().filter(n => n.props.role === "menuitem")[3];
  assert.equal(disabled.props.disabled, true); invoke(disabled, "onClick"); assert.equal(opened, 1);
  Object.assign(props, { onCreateDefect: undefined });
  assert.equal(render().filter(n => n.props.role === "menuitem").length, 3);
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
