import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useCreateCaseEntrance } from "../useCreateCaseEntrance";

function fixture() {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const listeners = new Set<() => void>();
  const preference = { matches: false, addEventListener: (_name: string, callback: () => void) => listeners.add(callback),
    removeEventListener: (_name: string, callback: () => void) => listeners.delete(callback) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => preference } });
  const calls: { frames: Keyframe[]; cancelled: boolean }[] = [];
  const ref = { current: { animate(frames: Keyframe[]) {
    const call = { frames, cancelled: false }; calls.push(call); return { cancel() { call.cancelled = true; } };
  } } as unknown as HTMLElement };
  function Probe({ creating, draft = "" }: { creating: boolean; draft?: string }) {
    useCreateCaseEntrance(ref, creating); return <span>{draft}</span>;
  }
  return { Probe, ref, calls, listeners, preference, restore() {
    if (original) Object.defineProperty(globalThis, "window", original); else Reflect.deleteProperty(globalThis, "window");
  } };
}

test("only create entry animates; draft edits retain the form and close cancels the entrance", () => {
  const f = fixture(); let renderer!: ReactTestRenderer;
  try {
    act(() => { renderer = create(<f.Probe creating={false} />); }); assert.equal(f.calls.length, 0);
    act(() => renderer.update(<f.Probe creating draft="Untitled case" />));
    assert.equal(f.calls.length, 1); assert.equal(f.calls[0].frames[0].transform, "translateX(100%)");
    act(() => renderer.update(<f.Probe creating draft="A draft the QA has edited" />));
    assert.equal(f.calls.length, 1); assert.equal(renderer.root.findByType("span").children[0], "A draft the QA has edited");
    act(() => renderer.update(<f.Probe creating={false} />)); assert.equal(f.calls[0].cancelled, true);
    act(() => renderer.update(<f.Probe creating />)); assert.equal(f.calls.length, 2);
    act(() => renderer.unmount()); assert.equal(f.calls[1].cancelled, true); assert.equal(f.listeners.size, 0);
  } finally { f.restore(); }
});

test("reduced motion skips entry and a runtime preference change cancels an active entry", () => {
  const f = fixture(); let renderer!: ReactTestRenderer;
  try {
    f.preference.matches = true;
    act(() => { renderer = create(<f.Probe creating />); }); assert.equal(f.calls.length, 0);
    act(() => renderer.update(<f.Probe creating={false} />)); f.preference.matches = false;
    act(() => renderer.update(<f.Probe creating />)); assert.equal(f.calls.length, 1);
    f.preference.matches = true; f.listeners.forEach(callback => callback()); assert.equal(f.calls[0].cancelled, true);
    act(() => renderer.unmount());
  } finally { f.restore(); }
});

test("an unavailable animation API leaves creation usable", () => {
  const f = fixture(); let renderer!: ReactTestRenderer;
  try {
    f.ref.current = {} as HTMLElement;
    act(() => { renderer = create(<f.Probe creating draft="Usable static editor" />); });
    assert.equal(f.calls.length, 0); assert.equal(renderer.root.findByType("span").children[0], "Usable static editor");
    act(() => renderer.unmount());
  } finally { f.restore(); }
});
