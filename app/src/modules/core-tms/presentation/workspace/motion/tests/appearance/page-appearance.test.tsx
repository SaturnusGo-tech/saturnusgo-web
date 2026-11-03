import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { usePageAppearance } from "../../usePageAppearance";

function fixture() {
  const descriptors = ["document", "window"].map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const dataset: Record<string, string> = {}, preference = { matches: false };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: { dataset } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => preference } });
  const calls: { frames: Keyframe[]; cancelled: boolean }[] = [];
  const element = { animate(frames: Keyframe[]) {
    const call = { frames, cancelled: false }; calls.push(call);
    return { cancel() { call.cancelled = true; } };
  } };
  function Page({ route }: { route: string }) { return <div ref={usePageAppearance(route)}>{route}</div>; }
  return { Page, dataset, preference, calls, element, restore() {
    ["document", "window"].forEach((key, index) => descriptors[index]
      ? Object.defineProperty(globalThis, key, descriptors[index]!) : Reflect.deleteProperty(globalThis, key));
  } };
}

test("fallback reveals the destination without shifting its text or retaining an old screen", () => {
  const f = fixture(); let renderer!: ReactTestRenderer;
  try {
    act(() => { renderer = create(<f.Page route="cases"/>, { createNodeMock: () => f.element }); });
    assert.equal(f.calls.length, 0);
    act(() => renderer.update(<f.Page route="dashboard"/>));
    assert.equal(renderer.root.findByType("div").children[0], "dashboard");
    assert.equal(f.calls.length, 1);
    assert.ok(f.calls[0].frames.every(frame => frame.transform === undefined), "page text must remain in its final position");
    assert.equal(f.calls[0].frames[0].opacity, 0); assert.equal(f.calls[0].frames[1].opacity, 1);
    act(() => renderer.update(<f.Page route="shared-steps"/>));
    assert.equal(f.calls[0].cancelled, true); assert.equal(f.calls.length, 2);
    act(() => renderer.unmount()); assert.equal(f.calls[1].cancelled, true);
  } finally { f.restore(); }
});

test("native snapshots and reduced motion never receive an extra fallback animation", () => {
  const f = fixture(); let renderer!: ReactTestRenderer;
  try {
    act(() => { renderer = create(<f.Page route="cases"/>, { createNodeMock: () => f.element }); });
    f.dataset.falconTransition = "true";
    act(() => renderer.update(<f.Page route="dashboard"/>)); assert.equal(f.calls.length, 0);
    delete f.dataset.falconTransition; f.preference.matches = true;
    act(() => renderer.update(<f.Page route="shared-steps"/>)); assert.equal(f.calls.length, 0);
    act(() => renderer.unmount());
  } finally { f.restore(); }
});
