import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { useFolderDropReveal } from "../../branch/hover/useFolderDropReveal";
import { caseDrag, dragHarness, elements, folderDrag } from "./drag-context-harness";

test("dragging an unselected case moves only that case and preserves the existing selection", async () => {
  const selected = new Set(["payments-1", "profile-2"]);
  const h = dragHarness(selected);
  const active = caseDrag("transfers-3");
  h.start(active);
  assert.equal(h.label(), "Test case");
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
  assert.equal(h.label(), "Selected test cases");
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
  h.drop(folderDrag("child"), null);
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

test("pickup freezes a cross-folder selection and cancellation restores every source row", async () => {
  const selected = new Set(["one", "two"]), h = dragHarness(selected), active = caseDrag("one");
  h.start(active);
  assert.deepEqual([...h.selection().caseIds], ["one", "two"]);
  selected.delete("two"); selected.add("three");
  h.drop(active, "target");
  assert.deepEqual(h.moves[0].ids, ["one", "two"]);
  assert.equal(h.selection().active, false); assert.equal(h.selection().caseIds.size, 0);
  h.moves[0].resolve({ ok: true }); await setImmediate();
  h.start(active); h.context().onDragCancel();
  assert.equal(h.selection().active, false); assert.equal(h.selection().caseIds.size, 0);
  assert.deepEqual([...selected], ["one", "three"]);
});

test("archived, unknown, busy, loading and newly revoked destinations never reach a mutation", () => {
  const h = dragHarness(), active = caseDrag("one");
  h.props.resource.items = [...h.props.resource.items, { ...h.props.resource.items[0], id: "archived", path: "/Archive", archivedAt: "2026-09-23" }];
  h.drop(active, "archived"); h.drop(active, "unknown"); h.drop(folderDrag("archived"), "target");
  h.start(active); h.props.resource.busy = true; h.drop(active, "target"); h.props.resource.busy = false;
  h.start(active); h.props.resource.loading = true; h.drop(active, "target"); h.props.resource.loading = false;
  h.start(active); h.props.resource.canManage = false; h.drop(active, "target");
  assert.equal(h.moves.length, 0); assert.equal(h.updates.length, 0);
  assert.equal(h.selection().active, false);
});

test("moving folders rejects unchanged parents and stale-path cycles, but nested folders can change parents", async () => {
  const h = dragHarness();
  h.drop(folderDrag("child"), "source"); h.drop(folderDrag("source"), null);
  h.props.resource.items = h.props.resource.items.map(item => item.id === "deep" ? { ...item, path: "/stale-path" } : item);
  h.drop(folderDrag("source"), "deep");
  assert.equal(h.updates.length, 0);
  h.drop(folderDrag("child"), "target");
  assert.equal(h.updates[0].folder.id, "child"); assert.equal(h.updates[0].patch.parentId, "target");
  h.updates[0].resolve(true); await setImmediate();
});

test("collision feedback includes only valid pointer targets and never chooses a nearby folder outside the pointer", () => {
  const h = dragHarness(); h.start(folderDrag("source"));
  const rect = { top: 0, left: 0, bottom: 40, right: 100, width: 100, height: 40 };
  const targets = ["source", "child", "deep", "target", "unknown"].map(folderId => ({
    id: folderId, disabled: false, data: { current: { folderId } }, rect: { current: rect }, node: { current: null }, key: folderId,
  }));
  const args = { pointerCoordinates: { x: 20, y: 20 }, droppableContainers: targets,
    droppableRects: new Map(targets.map(target => [target.id, rect])) } as unknown as Parameters<ReturnType<typeof h.context>["collisionDetection"]>[0];
  assert.deepEqual(h.context().collisionDetection(args).map(item => item.id), ["target"]);
  assert.deepEqual(h.context().collisionDetection({ ...args, pointerCoordinates: { x: 300, y: 300 } }), []);
});

test("only one mutation runs at a time and an unexpected transport rejection is recoverable", async () => {
  const h = dragHarness(), active = caseDrag("one");
  h.start(active); h.drop(active, "target"); h.drop(caseDrag("two"), "target");
  assert.equal(h.moves.length, 1);
  h.moves[0].resolve({ ok: true }); await setImmediate();
  h.props.resource.moveCases = async () => { throw new Error("network"); };
  h.start(active); h.drop(active, "target"); await setImmediate();
  assert.equal(h.selection().active, false); assert.equal(h.preview().length, 0);
  assert.match(String((h.alerts()[0].props.children as unknown[])[0]), /Could not move/);
});

test("closed folders expand after deliberate hover; leaving, opening and unmounting cancel the timer", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const calls: string[] = [];
  function Target({ over = true, open = false }: { over?: boolean; open?: boolean }) {
    useFolderDropReveal(over, open, "folder", id => calls.push(id)); return null;
  }
  const target = (props: { over?: boolean; open?: boolean } = {}) => createElement(Target, props) as unknown as Parameters<typeof create>[0];
  let view!: ReturnType<typeof create>;
  act(() => { view = create(target()); });
  act(() => context.mock.timers.tick(649)); assert.deepEqual(calls, []);
  act(() => context.mock.timers.tick(1)); assert.deepEqual(calls, ["folder"]);
  act(() => view.update(target({ over: false })));
  act(() => view.update(target()));
  act(() => view.update(target({ over: false })));
  act(() => context.mock.timers.tick(1000)); assert.equal(calls.length, 1);
  act(() => view.update(target()));
  act(() => view.update(target({ open: true })));
  assert.equal(calls.length, 2, "An already-open destination is explicitly preserved immediately");
  act(() => context.mock.timers.tick(1000)); assert.equal(calls.length, 2);
  act(() => view.update(target()));
  act(() => view.unmount());
  act(() => context.mock.timers.tick(1000)); assert.equal(calls.length, 2);
});
