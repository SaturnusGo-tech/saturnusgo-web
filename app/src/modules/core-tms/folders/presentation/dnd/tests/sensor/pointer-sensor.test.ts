import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { PointerSensor } from "@dnd-kit/core";
import { caseDrag, dragHarness } from "../drag-context-harness";
import { pointerHarness } from "./pointer-harness";

test("a normal five-pixel mouse movement starts dragging without a hold", async () => {
  const h = dragHarness(new Set(["case-a", "case-b"])); const active = caseDrag("case-a");
  const descriptor = h.context().sensors[0];
  assert.equal(descriptor.sensor, PointerSensor);
  const pointer = pointerHarness(descriptor, { start: () => h.start(active), end: () => h.drop(active, "target") });
  pointer.move(14); assert.equal(pointer.counts.starts, 0);
  pointer.move(16); assert.equal(pointer.counts.starts, 1);
  pointer.move(90, 75); pointer.release();
  assert.deepEqual(h.moves[0].ids, ["case-a", "case-b"]);
  h.moves[0].resolve({ ok: true }); await setImmediate();
});

test("a click or tiny movement still opens the case without moving it", () => {
  const h = dragHarness(); const pointer = pointerHarness(h.context().sensors[0]);
  pointer.move(12); pointer.release();
  assert.equal(pointer.counts.starts, 0); assert.equal(h.moves.length, 0);
});

test("the real sensor activator ignores secondary pointers and non-primary buttons", () => {
  const activate = PointerSensor.activators[0].handler;
  const nativeEvent = { isPrimary: true, button: 0 };
  const event = (value: typeof nativeEvent) => ({ nativeEvent: value }) as Parameters<typeof activate>[0];
  assert.equal(activate(event({ ...nativeEvent, isPrimary: false }), {}), false);
  assert.equal(activate(event({ ...nativeEvent, button: 2 }), {}), false);
  assert.equal(activate(event(nativeEvent), {}), true);
});
