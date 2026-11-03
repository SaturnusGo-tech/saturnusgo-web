import assert from "node:assert/strict";
import { test } from "node:test";
import { casesMoveHarness, moveHarness, nodes } from "./harness";

const event = { preventDefault() {}, stopPropagation() {}, key: "Escape" };
test("move is an inline destination task, without a modal or backdrop", t => {
  const f = moveHarness(); t.after(f.dispose);
  const rendered = f.render();
  assert.equal(nodes(rendered, "Modal").length, 0);
  assert.equal(nodes(rendered, "section").length, 1);
  assert.equal(nodes(rendered, "ParentFolderPicker")[0].props.inline, true);
  const cancel = nodes(rendered, "button").find(node => node.props["aria-label"] === "Back to test cases");
  assert.ok(cancel); cancel.props.onClick();
  assert.deepEqual(f.calls, ["close"]);
});

test("chosen destination moves every selected case and only clears selection on success", async t => {
  const f = moveHarness(); t.after(f.dispose);
  nodes(f.render(), "ParentFolderPicker")[0].props.onChange("/Web");
  const form = nodes(f.render(), "form")[0]; assert.ok(form);
  await form.props.onSubmit(event);
  assert.deepEqual(f.calls, [[["one", "two"], "web"], "moved", "close"]);
});

test("a removed destination is revalidated and keeps the selection available", async t => {
  const f = moveHarness(); t.after(f.dispose);
  nodes(f.render(), "ParentFolderPicker")[0].props.onChange("/Web");
  f.props.resource.items = [];
  await nodes(f.render(), "form")[0].props.onSubmit(event);
  assert.equal(f.calls.length, 0);
  assert.ok(nodes(f.render(), "p").some(node => node.props.role === "alert"));
});

test("busy operations prevent dismissal; failed moves leave the task open", async t => {
  const f = moveHarness(); t.after(f.dispose);
  f.props.resource.busy = true;
  nodes(f.render(), "section")[0].props.onKeyDown(event);
  assert.deepEqual(f.calls, []);
  f.props.resource.busy = false;
  f.props.resource.moveCases = async () => ({ ok: false, message: "Conflict. Refresh and retry." });
  await nodes(f.render(), "form")[0].props.onSubmit(event);
  assert.deepEqual(f.calls, []);
  assert.ok(nodes(f.render(), "p").some(node => node.props.role === "alert"));
});

test("reusing a removed destination path never moves into a different folder without another selection", async t => {
  const f = moveHarness(); t.after(f.dispose);
  nodes(f.render(), "ParentFolderPicker")[0].props.onChange("/Web");
  f.props.resource.items = [{ ...f.props.resource.items[0], id: "replacement" }];
  await nodes(f.render(), "form")[0].props.onSubmit(event);
  assert.deepEqual(f.calls, []);
  assert.ok(nodes(f.render(), "p").some(node => node.props.role === "alert"));
  nodes(f.render(), "ParentFolderPicker")[0].props.onChange("/Web");
  await nodes(f.render(), "form")[0].props.onSubmit(event);
  assert.deepEqual(f.calls, [[["one", "two"], "replacement"], "moved", "close"]);
});

test("canceling move preserves inspector selection and returns focus to Move before earlier tree buttons", t => {
  const f = casesMoveHarness(); t.after(f.dispose);
  nodes(f.render(), "CasesSelectionActions")[0].props.onAction("move");
  const active = f.render(), repository = nodes(active, "CasesRepositoryList")[0];
  assert.deepEqual(repository.props.move.ids, ["one", "two"]);
  assert.equal(nodes(active, "div").find(node => node.props["data-task"])?.props["data-task"], "move");
  repository.props.move.onClose(); f.render(); f.flush();
  assert.deepEqual(f.focused, ["move"]);
  assert.equal(f.view.inspectorOpen, true); assert.equal(f.view.detailFullscreen, true);
  assert.deepEqual(f.view.bulkSelection.selectedIds, ["one", "two"]);
});

test("successful move falls back to the visible inspector when selection is cleared and the narrow tree is hidden", t => {
  const f = casesMoveHarness(true); t.after(f.dispose);
  nodes(f.render(), "CasesSelectionActions")[0].props.onAction("move");
  const move = nodes(f.render(), "CasesRepositoryList")[0].props.move;
  move.onMoved(); move.onClose(); f.render(); f.flush();
  assert.deepEqual(f.focused, ["detail"]);
  assert.deepEqual(f.view.bulkSelection.selectedIds, []);
});
