import test from "node:test";
import assert from "node:assert/strict";
import type { useDefectPageDismiss } from "../useDefectPageDismiss";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";

test("page dismissal uses opacity only, prevents duplicate close and cleans up pending animation", () => {
  let finish: (() => void) | undefined, completed = 0, cancelled = 0;
  const h = componentHarness(undefined, { setTimeout: (done: () => void) => { finish = done; return 7; }, clearTimeout() {} });
  Object.assign(h.window, { matchMedia: () => ({ matches: false }) });
  const { useDefectPageDismiss: useDismiss } = h.load<{ useDefectPageDismiss: typeof useDefectPageDismiss }>(new URL("../useDefectPageDismiss.ts", import.meta.url));
  const state = h.render(useDismiss), frames: unknown[] = [];
  const panel = { inert: false, style: { animation: "" }, animate: (keyframes: unknown, options: unknown) => { frames.push({ keyframes, options }); return { cancel: () => cancelled++ }; } };
  state.panelRef.current = panel as unknown as HTMLElement;
  state.dismiss(() => completed++); state.dismiss(() => completed++);
  assert.equal(panel.inert, true); assert.equal(frames.length, 1); assert.equal(completed, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(frames[0])), { keyframes: [{ opacity: 1 }, { opacity: 0 }], options: { duration: 160, easing: "ease-out", fill: "forwards" } });
  finish?.(); assert.equal(completed, 1); h.dispose(); assert.equal(cancelled, 1);
});

test("reduced-motion close does not wait for page animation", () => {
  const h = componentHarness(undefined, { clearTimeout() {} }); Object.assign(h.window, { matchMedia: () => ({ matches: true }) });
  const { useDefectPageDismiss: useDismiss } = h.load<{ useDefectPageDismiss: typeof useDefectPageDismiss }>(new URL("../useDefectPageDismiss.ts", import.meta.url));
  const state = h.render(useDismiss); let completed = 0;
  state.panelRef.current = {} as HTMLElement; state.dismiss(() => completed++); assert.equal(completed, 1); h.dispose();
});
