import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { PointerSensor } from "@dnd-kit/core";
import { caseDrag, dragHarness } from "../drag-context-harness";
import { pointerHarness } from "./pointer-harness";

test("the real configured sensor waits 260ms before an unselected case can be dragged", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const selected = new Set(["payments-selected", "profile-selected"]);
  const h = dragHarness(selected); const active = caseDrag("transfers-unselected");
  const descriptor = h.context().sensors[0];
  assert.equal(descriptor.sensor, PointerSensor);
  assert.equal(descriptor.options.activationConstraint && "delay" in descriptor.options.activationConstraint
    ? descriptor.options.activationConstraint.delay : null, 260);
  const pointer = pointerHarness(descriptor, { start: () => h.start(active), end: () => h.drop(active, "target") });
  context.mock.timers.tick(259);
  assert.equal(pointer.counts.starts, 0);
  assert.equal(h.preview().length, 0);
  assert.equal(h.moves.length, 0);
  context.mock.timers.tick(1);
  assert.equal(pointer.counts.starts, 1);
  assert.equal((h.preview()[0].props.children as unknown[])[1], "1 cases");
  pointer.move(90, 75); pointer.release();
  assert.equal(pointer.counts.moves, 1);
  assert.deepEqual(h.moves[0].ids, ["transfers-unselected"]);
  assert.equal(h.moves[0].target, "target");
  h.moves[0].resolve({ ok: true }); await setImmediate();
  assert.deepEqual([...selected], ["payments-selected", "profile-selected"]);
  assert.equal(h.preview().length, 0);
  context.mock.timers.runAll();
});

test("motion beyond 6px before the hold delay cancels without preview or move", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const h = dragHarness(); const active = caseDrag("case-a");
  const pointer = pointerHarness(h.context().sensors[0], { start: () => h.start(active), end: () => h.drop(active, "target") });
  pointer.move(17);
  context.mock.timers.tick(1000);
  assert.equal(pointer.counts.starts, 0);
  assert.equal(pointer.counts.cancels, 1);
  assert.equal(pointer.counts.aborts, 1);
  assert.equal(h.preview().length, 0);
  assert.equal(h.moves.length, 0);
});

test("small pointer motion stays pending and releasing early never starts a drag", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const descriptor = dragHarness().context().sensors[0];
  const pointer = pointerHarness(descriptor);
  pointer.move(15);
  context.mock.timers.tick(120);
  assert.equal(pointer.counts.starts, 0);
  assert.equal(pointer.counts.cancels, 0);
  pointer.release(); context.mock.timers.tick(1000);
  assert.equal(pointer.counts.starts, 0);
  assert.equal(pointer.counts.aborts, 1);
  assert.equal(pointer.counts.ends, 1);
});

test("the real sensor activator ignores secondary pointers and non-primary buttons", () => {
  const activate = PointerSensor.activators[0].handler;
  const nativeEvent = { isPrimary: true, button: 0 };
  const event = (value: typeof nativeEvent) => ({ nativeEvent: value }) as Parameters<typeof activate>[0];
  assert.equal(activate(event({ ...nativeEvent, isPrimary: false }), {}), false);
  assert.equal(activate(event({ ...nativeEvent, button: 2 }), {}), false);
  assert.equal(activate(event(nativeEvent), {}), true);
});
