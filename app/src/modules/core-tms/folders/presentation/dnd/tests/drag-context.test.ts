import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { caseDrag, dragHarness, elements, folderDrag } from "./drag-context-harness";

test("dragging an unselected case moves only that case and preserves the existing selection", async () => {
  const selected = new Set(["payments-1", "profile-2"]);
  const h = dragHarness(selected);
  const active = caseDrag("transfers-3");
  h.start(active);
  assert.equal((h.preview()[0].props.children as unknown[])[1], "1 cases");
  h.drop(active, "target");
  assert.equal(h.moves.length, 1);
  assert.deepEqual(h.moves[0].ids, ["transfers-3"]);
  assert.equal(h.moves[0].target, "target");
  assert.equal(h.preview().length, 0);
  h.moves[0].resolve({ ok: true }); await setImmediate();
  assert.deepEqual([...selected], ["payments-1", "profile-2"]);
  assert.equal(h.alerts().length, 0);
});

test("a selected case drags the entire cross-folder selection in one operation", async () => {
  const selected = new Set(Array.from({ length: 80 }, (_, index) => `${index % 2 ? "profile" : "payments"}-${index}`));
  const h = dragHarness(selected);
  const active = caseDrag("profile-31");
  h.start(active);
  assert.equal((h.preview()[0].props.children as unknown[])[1], "80 cases");
  h.drop(active, "target");
  assert.equal(h.moves.length, 1);
  assert.deepEqual(h.moves[0].ids, [...selected]);
  h.moves[0].resolve({ ok: true }); await setImmediate();
  assert.equal(selected.size, 80);
});

test("failed moves retain selection, show the server error and clear the drag preview", async () => {
  const selected = new Set(["payments-1", "profile-2"]);
  const h = dragHarness(selected);
  const active = caseDrag("payments-1");
  h.start(active); h.drop(active, "target");
  assert.equal(h.preview().length, 0);
  assert.equal(h.alerts().length, 0);
  h.moves[0].resolve({ ok: false, message: "Selection changed. Refresh and retry." });
  await setImmediate();
  assert.deepEqual([...selected], ["payments-1", "profile-2"]);
  assert.equal((h.alerts()[0].props.children as unknown[])[0], "Selection changed. Refresh and retry.");
  assert.equal(elements(h.render(), (element) => element.props.role === "status").length, 0);
  assert.equal(h.updates.length, 0);
  h.start(active); h.drop(active, "target");
  assert.equal(h.alerts().length, 0);
  assert.deepEqual(h.moves[1].ids, [...selected]);
  h.moves[1].resolve({ ok: true }); await setImmediate();
});

test("dropping cases at root removes membership while missing targets and permission locks do nothing", async () => {
  const h = dragHarness(); const active = caseDrag("unfile-me");
  h.drop(active, null);
  assert.equal(h.moves[0].target, null);
  h.moves[0].resolve({ ok: true }); await setImmediate();
  h.drop(active, undefined); h.drop(active, "target", false);
  h.props.locked = true; h.drop(active, "target");
  h.props.locked = false; h.props.resource.canManage = false; h.drop(active, "target");
  assert.equal(h.moves.length, 1);
});

test("folder self/descendant drops are rejected but a similarly named sibling and root remain valid", async () => {
  const h = dragHarness(); const active = folderDrag("source", "Pay");
  h.start(active);
  h.drop(active, "source"); h.drop(active, "child"); h.drop(active, "deep");
  h.drop(folderDrag("missing"), "target");
  assert.equal(h.updates.length, 0);
  h.drop(active, "target");
  assert.equal(h.updates[0].folder.id, "source");
  assert.equal(h.updates[0].patch.parentId, "target");
  h.updates[0].resolve(true); await setImmediate();
  h.drop(active, null);
  assert.equal(h.updates[1].patch.parentId, null);
  h.updates[1].resolve(true); await setImmediate();
  assert.equal(h.moves.length, 0);
});

test("folder failure and drag cancellation never display a successful drop", async () => {
  const h = dragHarness(); h.props.ru = true;
  const active = folderDrag("source", "Pay");
  h.start(active); h.drop(active, "target");
  h.updates[0].resolve(false); await setImmediate();
  assert.match(String((h.alerts()[0].props.children as unknown[])[0]), /Папка не перемещена/);
  h.start(active); h.context().onDragCancel();
  assert.equal(h.preview().length, 0);
  assert.equal(h.alerts().length, 0);
  assert.equal(h.updates.length, 1);
  assert.ok(h.suppressUntil() > Date.now());
});
