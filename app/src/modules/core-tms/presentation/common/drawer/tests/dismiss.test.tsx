import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { useDrawerDismiss } from "../useDrawerDismiss";

test("drawer exit preserves an interrupted entrance, dismisses once and cancels on unmount", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalStyle = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
  let reduced = false;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => ({ matches: reduced }) } });
  Object.defineProperty(globalThis, "getComputedStyle", { configurable: true, value: () => ({ transform: "matrix(1,0,0,1,350,0)", backgroundColor: "rgba(8,18,26,.46)" }) });
  const calls: { frames: Keyframe[]; cancelled: boolean }[] = [];
  const animate = (frames: Keyframe[]) => { const call = { frames, cancelled: false }; calls.push(call); return { cancel: () => { call.cancelled = true; } }; };
  const panel = { inert: false, style: { animation: "" }, animate, parentElement: { style: { animation: "" }, animate } };
  let current!: ReturnType<typeof useDrawerDismiss>;
  function Harness() { current = useDrawerDismiss(); current.panelRef.current = panel as unknown as HTMLElement; return null; }
  let renderer!: ReturnType<typeof create>;
  let completed = 0;
  try {
    act(() => { renderer = create(createElement(Harness) as unknown as Parameters<typeof create>[0]); });
    act(() => { current.dismiss(() => completed++); current.dismiss(() => completed++); });
    assert.equal(completed, 0); assert.equal(panel.inert, true); assert.equal(current.closing, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].frames[0].transform, "matrix(1,0,0,1,350,0)");
    assert.equal(calls[0].frames[1].transform, "translateX(100%)");
    act(() => context.mock.timers.tick(239)); assert.equal(completed, 0);
    act(() => context.mock.timers.tick(1)); assert.equal(completed, 1);
    act(() => renderer.unmount()); assert.ok(calls.every(call => call.cancelled));
    act(() => { renderer = create(createElement(Harness) as unknown as Parameters<typeof create>[0]); current.dismiss(() => completed++); });
    act(() => renderer.unmount()); act(() => context.mock.timers.tick(300)); assert.equal(completed, 1);
    reduced = true;
    act(() => { renderer = create(createElement(Harness) as unknown as Parameters<typeof create>[0]); });
    act(() => current.dismiss(() => completed++)); assert.equal(completed, 2);
    act(() => renderer.unmount());
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalStyle) Object.defineProperty(globalThis, "getComputedStyle", originalStyle); else Reflect.deleteProperty(globalThis, "getComputedStyle");
  }
});
