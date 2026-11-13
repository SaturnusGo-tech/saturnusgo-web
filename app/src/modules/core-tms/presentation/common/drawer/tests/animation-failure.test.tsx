import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { useDrawerDismiss } from "../useDrawerDismiss";

for (const failure of ["missing-panel-animation", "panel-animation", "backdrop-animation", "computed-style"] as const) {
  test(`drawer still closes when ${failure} is unavailable`, async context => {
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalStyle = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
    const animations: { cancelled: boolean }[] = [];
    const animate = () => {
      const animation = { cancelled: false };
      animations.push(animation);
      return { cancel: () => { animation.cancelled = true; } };
    };
    const unavailable = () => { throw new Error("Animation unavailable"); };
    const backdrop = { style: { animation: "backdrop-enter" }, animate: failure === "backdrop-animation" ? unavailable : animate };
    const panel = { inert: false, style: { animation: "drawer-enter" }, parentElement: backdrop,
      animate: failure === "missing-panel-animation" ? undefined : failure === "panel-animation" ? unavailable : animate };
    Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => ({ matches: false }) } });
    Object.defineProperty(globalThis, "getComputedStyle", { configurable: true, value: failure === "computed-style" ? unavailable
      : () => ({ transform: "none", backgroundColor: "rgba(0,0,0,.4)", backdropFilter: "none" }) });
    let current!: ReturnType<typeof useDrawerDismiss>;
    function Harness() { current = useDrawerDismiss(); current.panelRef.current = panel as unknown as HTMLElement; return null; }
    let renderer: ReturnType<typeof create> | undefined;
    let completed = 0;
    try {
      act(() => { renderer = create(createElement(Harness) as unknown as Parameters<typeof create>[0]); });
      let exit: Promise<void> | undefined, repeated: Promise<void> | undefined;
      assert.doesNotThrow(() => act(() => {
        exit = current.dismiss(() => { completed++; });
        repeated = current.dismiss(() => { completed++; });
      }), "optional browser motion must not prevent dismissal");
      assert.ok(exit instanceof Promise);
      assert.equal(exit, repeated, "repeated close uses the original dismissal");
      assert.equal(completed, 1, "fallback closes immediately and only once");
      assert.equal(panel.inert, false, "failed animation must not trap the remaining UI");
      assert.equal(panel.style.animation, "drawer-enter");
      assert.equal(backdrop.style.animation, "backdrop-enter");
      assert.ok(animations.every(animation => animation.cancelled), "partially started motion is cancelled");
      let settled = false;
      void exit.then(() => { settled = true; });
      await Promise.resolve();
      assert.equal(settled, true, "dismissal promise settles even without browser motion");
      act(() => context.mock.timers.tick(500));
      assert.equal(completed, 1, "no timer can repeat the close callback");
    } finally {
      act(() => renderer?.unmount());
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
      if (originalStyle) Object.defineProperty(globalThis, "getComputedStyle", originalStyle); else Reflect.deleteProperty(globalThis, "getComputedStyle");
    }
  });
}
