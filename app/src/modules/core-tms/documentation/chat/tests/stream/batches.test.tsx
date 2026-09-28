import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTextBatch } from "../../state/stream/text-batch";
import { useConversationScroll } from "../../presentation/scroll/useConversationScroll";

Object.assign(globalThis, { React });

function animationFrames() {
  const frames = new Map<number, () => void>(); let sequence = 0, time = 0;
  return {
    now: () => time,
    schedule(callback: () => void) { frames.set(++sequence, callback); return sequence; },
    cancel(handle: unknown) { frames.delete(handle as number); },
    frame(milliseconds = 16) { time += milliseconds; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
    get pending() { return frames.size; },
  };
}

test("a large received burst reveals progressively and catches up within 80ms without inventing text", () => {
  const scheduler = animationFrames(), rendered: string[] = [], answer = "Actual words from the server. ".repeat(25);
  const batch = createTextBatch(text => rendered.push(text), scheduler);
  batch.append(answer); scheduler.frame();
  assert.ok(rendered[0].length > 0 && rendered[0].length < answer.length);
  while (scheduler.pending && scheduler.now() < 80) scheduler.frame();
  assert.equal(rendered[rendered.length - 1], answer); assert.equal(scheduler.pending, 0);
  assert.ok(rendered.length > 1);
  rendered.forEach((text, index) => { assert.ok(answer.startsWith(text)); if (index) assert.ok(text.length > rendered[index - 1].length); });
});

test("continued deltas cannot postpone an older burst or build a typing backlog", () => {
  const scheduler = animationFrames(), rendered: string[] = []; let received = "a".repeat(600);
  const batch = createTextBatch(text => rendered.push(text), scheduler); batch.append(received);
  for (let frame = 0; frame < 5; frame++) { scheduler.frame(); received += "b".repeat(80); batch.append("b".repeat(80)); }
  assert.ok(rendered[rendered.length - 1]!.length >= 600);
  for (let frame = 0; frame < 5; frame++) scheduler.frame();
  assert.equal(rendered[rendered.length - 1], received); assert.equal(scheduler.pending, 0);
});

test("revealing received text preserves whole emoji graphemes and does not render a dangling surrogate", () => {
  const scheduler = animationFrames(), rendered: string[] = [], emoji = "👩🏽‍💻";
  const batch = createTextBatch(text => rendered.push(text), scheduler);
  batch.append(emoji.repeat(40));
  for (let frame = 0; frame < 5; frame++) scheduler.frame();
  for (const text of rendered) assert.equal(text, emoji.repeat(text.length / emoji.length));
  const before = rendered.length; batch.append("\uD83D"); scheduler.frame();
  assert.equal(rendered.length, before); assert.equal(scheduler.pending, 0);
  batch.append("\uDE80"); scheduler.frame(); assert.equal(rendered[rendered.length - 1], emoji.repeat(40) + "🚀");
});

test("reduced motion bypasses progressive reveal and cancel clears remaining frames", () => {
  const scheduler = animationFrames(), rendered: string[] = [];
  const original = Object.getOwnPropertyDescriptor(globalThis, "matchMedia");
  Object.defineProperty(globalThis, "matchMedia", { configurable: true, value: () => ({ matches: true }) });
  try {
    const answer = "a".repeat(800), batch = createTextBatch(text => rendered.push(text), scheduler);
    batch.append(answer); scheduler.frame(); assert.deepEqual(rendered, [answer]); assert.equal(scheduler.pending, 0);
  } finally { if (original) Object.defineProperty(globalThis, "matchMedia", original); else Reflect.deleteProperty(globalThis, "matchMedia"); }
  const batch = createTextBatch(text => rendered.push(text), scheduler); batch.append("b".repeat(800)); scheduler.frame();
  assert.equal(scheduler.pending, 1); const count = rendered.length;
  batch.cancel(); scheduler.frame(); assert.equal(rendered.length, count); assert.equal(scheduler.pending, 0);
});

test("one frame coalesces real deltas and cancel prevents a queued late render", () => {
  const frames = new Map<number, () => void>(), rendered: string[] = []; let sequence = 0;
  const batch = createTextBatch(text => rendered.push(text), { schedule(callback) { frames.set(++sequence, callback); return sequence; }, cancel(handle) { frames.delete(handle as number); } });
  batch.append("First "); batch.append("part"); assert.equal(frames.size, 1); assert.deepEqual(rendered, []);
  frames.get(1)!(); frames.delete(1); assert.deepEqual(rendered, ["First part"]);
  batch.append(" second"); batch.cancel(); assert.equal(frames.size, 0); batch.append(" late"); assert.equal(frames.size, 0);
  assert.deepEqual(rendered, ["First part"]);
});

test("content follows only near the bottom; a saved message target suppresses automatic bottom scroll", () => {
  let state!: ReturnType<typeof useConversationScroll>, renderer!: ReactTestRenderer, revision = 0, targetId: string | null = null, focused = 0;
  const element = { scrollTop: 600, scrollHeight: 1000, clientHeight: 400, firstElementChild: null,
    getBoundingClientRect: () => ({ top: 10 }), querySelector: () => targetId ? { getBoundingClientRect: () => ({ top: 300 }), focus: () => focused++ } : null };
  function Hook() { state = useConversationScroll(revision, revision, "chat", targetId); state.scroll.current = element as unknown as HTMLDivElement; return null; }
  act(() => { renderer = create(<Hook />); });
  act(() => { element.scrollTop = 600; state.onScroll(); element.scrollHeight = 1100; revision++; renderer.update(<Hook />); });
  assert.equal(element.scrollTop, 1100);
  act(() => { element.scrollTop = 100; state.onScroll(); element.scrollHeight = 1200; revision++; renderer.update(<Hook />); });
  assert.equal(element.scrollTop, 100);
  act(() => { targetId = "9302bbdf-79bb-4528-9d03-694064432151"; revision++; renderer.update(<Hook />); });
  assert.equal(element.scrollTop, 374); assert.equal(focused, 1);
  act(() => { revision++; renderer.update(<Hook />); }); assert.equal(element.scrollTop, 374); assert.equal(focused, 1);
  act(() => renderer.unmount());
});
