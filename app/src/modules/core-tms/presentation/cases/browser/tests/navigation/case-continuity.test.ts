import assert from "node:assert/strict";
import test from "node:test";
import { browserHarness, elements } from "../browser-harness";

test("closing creation restores the already selected detail instead of the empty pane", () => {
  const app = browserHarness();
  try {
    app.props.onSelectCase("transfer-case"); app.props.revision = { title: "Transfer accounts" } as typeof app.props.revision;
    app.render();
    app.props.editor = { mode: "create", value: { title: "Unsaved" }, onCancel() { app.props.editor = undefined; } } as typeof app.props.editor;
    app.render().closeInspector();
    const restored = app.renderView();
    assert.equal(app.props.selectedCaseId, "transfer-case");
    assert.equal(elements(restored, item => item.type === "CaseBrowserEmpty").length, 0);
    assert.equal(elements(restored, item => item.type === "CaseDetailPanel")[0]?.props.testCase, app.items[0]);
  } finally { app.dispose(); }
});

test("closing an unselected creation keeps the original empty pane", () => {
  const app = browserHarness();
  try {
    app.props.editor = { mode: "create", value: { title: "Unsaved" }, onCancel() { app.props.editor = undefined; } } as typeof app.props.editor;
    app.render().closeInspector();
    assert.equal(app.props.selectedCaseId, "");
    assert.equal(elements(app.renderView(), item => item.type === "CaseBrowserEmpty").length, 1);
  } finally { app.dispose(); }
});

test("switching cases commits the latest identity without a snapshot of the previous text", () => {
  const snapshots: Array<() => void> = [], app = browserHarness(update => { snapshots.push(update); });
  try {
    app.props.onSelectCase("transfer-case"); app.render();
    app.render().selectRow({ testCase: app.items[1], folderPath: app.items[1].folderPath });
    assert.equal(app.props.selectedCaseId, "profile-case");
    assert.equal(app.props.selectedFolderId, "profile");
    assert.equal(snapshots.length, 0, "case changes must not retain an old full-workspace snapshot");
    app.render().selectRow({ testCase: app.items[0], folderPath: app.items[0].folderPath });
    assert.equal(app.props.selectedCaseId, "transfer-case");
  } finally { app.dispose(); }
});
