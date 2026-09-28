import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTextBatch } from "../../state/stream/text-batch";
import { useConversationScroll } from "../../presentation/scroll/useConversationScroll";

Object.assign(globalThis, { React });

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
