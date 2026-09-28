import assert from "node:assert/strict";
import { test } from "node:test";
import { createTextBatch } from "../../state/stream/text-batch";
import { useConversationScroll } from "../../presentation/scroll/useConversationScroll";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";

test("one frame coalesces real deltas and cancel prevents a queued late render", () => {
  const frames = new Map<number, () => void>(), rendered: string[] = []; let sequence = 0;
  const batch = createTextBatch(text => rendered.push(text), { schedule(callback) { frames.set(++sequence, callback); return sequence; }, cancel(handle) { frames.delete(handle as number); } });
  batch.append("First "); batch.append("part"); assert.equal(frames.size, 1); assert.deepEqual(rendered, []);
  frames.get(1)!(); frames.delete(1); assert.deepEqual(rendered, ["First part"]);
  batch.append(" second"); batch.cancel(); assert.equal(frames.size, 0); batch.append(" late"); assert.equal(frames.size, 0);
  assert.deepEqual(rendered, ["First part"]);
});

test("content changes follow the conversation only while the reader remains near the bottom", () => {
  const h = componentHarness();
  const { useConversationScroll: useScroll } = h.load<{ useConversationScroll: typeof useConversationScroll }>(new URL("../../presentation/scroll/useConversationScroll.ts", import.meta.url));
  let state = h.render(() => useScroll("initial", 0));
  const element = { scrollTop: 600, scrollHeight: 1000, clientHeight: 400 };
  state.scroll.current = element as HTMLDivElement; state.onScroll();
  element.scrollHeight = 1100; state = h.render(() => useScroll("new delta", 1)); assert.equal(element.scrollTop, 1100);
  element.scrollTop = 100; state.onScroll(); element.scrollHeight = 1200;
  state = h.render(() => useScroll("another delta", 1)); assert.equal(element.scrollTop, 100);
  element.scrollTop = 795; state.onScroll(); element.scrollHeight = 1300;
  h.render(() => useScroll("complete", 2)); assert.equal(element.scrollTop, 1300);
});
