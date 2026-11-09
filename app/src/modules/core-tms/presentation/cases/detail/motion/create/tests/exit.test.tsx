import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useCasePanelExit } from "../../useCasePanelExit";
function fixture() {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window"), originalStyle = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
  const listeners = new Set<() => void>(), preference = { matches: false, addEventListener: (_: string, cb: () => void) => listeners.add(cb), removeEventListener: (_: string, cb: () => void) => listeners.delete(cb) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => preference } });
  Object.defineProperty(globalThis, "getComputedStyle", { configurable: true, value: () => ({ transform: "matrix(1,0,0,1,24,0)", opacity: "1" }) });
  const calls: { frames: Keyframe[]; cancel: () => void; finish: () => void; cancelled: boolean }[] = [];
  const element = { inert: false, dataset: {} as DOMStringMap, getAnimations: () => [], animate(frames: Keyframe[]) {
    let finish!: () => void; const finished = new Promise<void>(resolve => { finish = resolve; });
    const call = { frames, finish, cancelled: false, cancel() { call.cancelled = true; finish(); } }; calls.push(call); return { ...call, finished };
  } };
  let exit!: (close: () => void) => void;
  function Probe({ creating = true }: { creating?: boolean }) { exit = useCasePanelExit({ current: element as unknown as HTMLElement }, creating); return null; }
  return { Probe, element, calls, listeners, preference, exit: (cb: () => void) => exit(cb), restore() {
    for (const [key, descriptor] of [["window", originalWindow], ["getComputedStyle", originalStyle]] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  } };
}
test("create close retains the draft until rightward exit completes and ignores repeated close", async () => {
  const f = fixture(); let renderer!: ReactTestRenderer, closed = 0;
  try {
    act(() => { renderer = create(<f.Probe/>); });
    act(() => { f.exit(() => closed++); f.exit(() => closed++); });
    assert.equal(closed, 0); assert.equal(f.element.inert, true); assert.equal(f.element.dataset.casePanelClosing, ""); assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].frames[1].transform, "translateX(100%)");
    await act(async () => { f.calls[0].finish(); });
    assert.equal(closed, 1); assert.equal(f.element.inert, false); assert.equal(f.element.dataset.casePanelClosing, undefined); assert.equal(f.listeners.size, 0);
    act(() => renderer.unmount());
  } finally { f.restore(); }
});
test("dismissal replaces the draft before releasing the final hidden frame", async () => {
  const f = fixture(); let renderer!: ReactTestRenderer, cancelledAtCommit = true;
  try {
    act(() => { renderer = create(<f.Probe/>); });
    act(() => f.exit(() => { cancelledAtCommit = f.calls[0].cancelled; }));
    await act(async () => { f.calls[0].finish(); });
    assert.equal(cancelledAtCommit, false, "the filled exit must still hide the live draft while React commits its replacement");
    assert.equal(f.calls[0].cancelled, true); act(() => renderer.unmount());
  } finally { f.restore(); }
});
test("unmount cancels exit without closing a different screen", async () => {
  const f = fixture(); let renderer!: ReactTestRenderer, closed = 0;
  try {
    act(() => { renderer = create(<f.Probe/>); }); act(() => f.exit(() => closed++));
    await act(async () => { renderer.unmount(); });
    assert.equal(closed, 0); assert.equal(f.calls[0].cancelled, true); assert.equal(f.element.inert, false);
  } finally { f.restore(); }
});
test("reduced motion or disabled animation closes immediately; preference change safely completes exit", async () => {
  const f = fixture(); let renderer!: ReactTestRenderer, closed = 0;
  try {
    f.preference.matches = true; act(() => { renderer = create(<f.Probe/>); });
    act(() => f.exit(() => closed++)); assert.equal(closed, 1); assert.equal(f.calls.length, 0);
    f.preference.matches = false; act(() => renderer.update(<f.Probe creating={false}/>));
    act(() => f.exit(() => closed++)); assert.equal(closed, 2); assert.equal(f.calls.length, 0);
    act(() => renderer.update(<f.Probe/>)); act(() => f.exit(() => closed++));
    await act(async () => { f.preference.matches = true; f.listeners.forEach(cb => cb()); });
    assert.equal(closed, 3); assert.equal(f.element.inert, false); act(() => renderer.unmount());
  } finally { f.restore(); }
});
