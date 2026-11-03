import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import React, { useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSidebarReveal } from "../useSidebarReveal";

async function setup(t: TestContext, initialCollapsed = true) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const descriptors = new Map(["window", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const win = Object.assign(new EventTarget(), { innerWidth: 1280 });
  const outside = {}, popup = { contains: (value: unknown) => value === popup }, trigger = { getAttribute: () => "owned-popup" };
  const independent = ["nav-account", "nav-notifications"].map(id => {
    const control = { closest: (selector: string) => selector === "[data-sidebar-independent]" ? control : null, getAttribute: () => id };
    const panel = { contains: (value: unknown) => value === panel };
    return { id, control, panel };
  });
  const root = Object.assign(new EventTarget(), { contains: (value: unknown) => value === root,
    querySelectorAll: (selector: string) => selector.includes("data-sidebar-independent") ? independent.map(item => item.control) : [trigger] });
  const doc = Object.assign(new EventTarget(), { activeElement: outside as unknown,
    getElementById: (id: string) => id === "owned-popup" ? popup : independent.find(item => item.id === id)?.panel ?? null });
  Object.defineProperties(globalThis, { window: { configurable: true, value: win }, document: { configurable: true, value: doc } });
  let renderer!: ReactTestRenderer, collapsed = initialCollapsed, reveal!: ReturnType<typeof useSidebarReveal>; const changes: boolean[] = [], ref = { current: root as unknown as HTMLElement };
  function Probe() {
    const [value, setValue] = useState(initialCollapsed); collapsed = value;
    reveal = useSidebarReveal(ref, value, next => { changes.push(next); setValue(next); }); return null;
  }
  await act(async () => { renderer = create(React.createElement(Probe) as Parameters<typeof create>[0]); });
  t.after(async () => {
    await act(async () => renderer.unmount());
    for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const emit = async (target: EventTarget, type: string, values: Record<string, unknown> = {}) => {
    const { target: suppliedTarget, ...properties } = values;
    const event = Object.assign(new Event(type, { cancelable: true }), { pointerType: "mouse", pointerId: 1, isPrimary: true, button: 0, clientX: 0, clientY: 0 }, properties);
    if (suppliedTarget) Object.defineProperty(event, "target", { value: suppliedTarget });
    await act(async () => { target.dispatchEvent(event); }); return event;
  };
  const tick = async (time: number) => { await act(async () => { t.mock.timers.tick(time); }); };
  return { root, win, doc, popup, outside, independent, changes, collapsed: () => collapsed, reveal: () => reveal, emit, tick };
}

test("a manually closed rail ignores hover and focus until a deliberate open gesture", async t => {
  const h = await setup(t); await h.emit(h.root, "pointerenter"); assert.equal(h.collapsed(), true);
  await h.tick(500); assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "focusin"); assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "pointerleave", { relatedTarget: h.outside }); await h.tick(200);
  assert.equal(h.reveal().revealed, false); assert.equal(h.collapsed(), true); assert.deepEqual(h.changes, []);
});

test("owned Escape explicitly closes reveal mode until a deliberate keyboard reopen", async t => {
  const h = await setup(t, false); await h.emit(h.root, "focusin"); assert.equal(h.reveal().revealed, true);
  h.doc.activeElement = h.root; await h.emit(h.doc, "keydown", { key: "Escape" }); assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "pointerenter"); await h.tick(120); assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "pointerleave"); await h.emit(h.root, "pointerenter"); await h.tick(120); assert.equal(h.reveal().revealed, false);
  await act(async () => h.reveal().setCollapsed(false)); assert.equal(h.reveal().revealed, true);
  assert.deepEqual(h.changes, [true, false]);
});

test("long press then horizontal drag collapses and suppresses its click; vertical scroll stays native", async t => {
  const h = await setup(t, false);
  await h.emit(h.root, "pointerdown", { pointerType: "touch", clientX: 180, clientY: 100 }); await h.tick(180);
  const vertical = await h.emit(h.win, "pointermove", { clientX: 177, clientY: 180 });
  await h.emit(h.win, "pointerup", { clientX: 177, clientY: 180 }); assert.equal(vertical.defaultPrevented, false); assert.deepEqual(h.changes, []);
  await h.emit(h.root, "pointerdown", { pointerType: "touch", clientX: 180, clientY: 100 }); await h.tick(180);
  const horizontal = await h.emit(h.win, "pointermove", { clientX: 100, clientY: 110 });
  await h.emit(h.win, "pointerup", { clientX: 100, clientY: 110 });
  assert.equal(horizontal.defaultPrevented, true); assert.equal(h.collapsed(), true); assert.deepEqual(h.changes, [true]);
  assert.equal((await h.emit(h.root, "click")).defaultPrevented, true);
});

test("a quick or cancelled drag cannot change the saved sidebar width", async t => {
  const h = await setup(t, false);
  await h.emit(h.root, "pointerdown", { clientX: 180 }); await h.emit(h.win, "pointermove", { clientX: 100 });
  await h.emit(h.win, "pointerup", { clientX: 100 }); assert.deepEqual(h.changes, []);
  await h.emit(h.root, "pointerdown", { clientX: 180 }); await h.tick(180); await h.emit(h.win, "pointermove", { clientX: 100 });
  await h.emit(h.win, "pointercancel", { clientX: 100 }); assert.deepEqual(h.changes, []);
});

test("drag right enables transient reveal; drag left disables subsequent hover and focus", async t => {
  const h = await setup(t); await h.emit(h.root, "pointerdown", { pointerType: "touch", clientX: 10 }); await h.tick(180);
  await h.emit(h.win, "pointermove", { clientX: 90 }); await h.emit(h.win, "pointerup", { clientX: 90 });
  assert.equal(h.collapsed(), false); assert.deepEqual(h.changes, [false]);
  assert.equal(h.reveal().revealed, true);
  await h.emit(h.root, "pointerleave"); await h.tick(250); await h.emit(h.doc, "pointerdown");
  assert.equal(h.reveal().revealed, false); assert.equal(h.collapsed(), false); assert.deepEqual(h.changes, [false]);
  await h.emit(h.root, "pointerenter"); await h.tick(120); assert.equal(h.reveal().revealed, true);
  await h.emit(h.root, "pointerleave"); await h.tick(200); assert.equal(h.reveal().revealed, false);
  await h.emit(h.doc, "keydown", { key: "Tab" }); await h.emit(h.root, "focusin"); assert.equal(h.reveal().revealed, true);
  await h.emit(h.root, "focusout", { relatedTarget: h.outside }); await h.tick(200); assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "pointerdown", { clientX: 180 }); await h.tick(180);
  await h.emit(h.win, "pointermove", { clientX: 90 }); await h.emit(h.win, "pointerup", { clientX: 90 });
  assert.equal(h.collapsed(), true); assert.deepEqual(h.changes, [false, true]);
  await h.emit(h.root, "pointerleave"); await h.emit(h.root, "pointerenter"); await h.tick(500);
  await h.emit(h.root, "focusin"); assert.equal(h.reveal().revealed, false);
});

test("unrelated Escape leaves an expanded sidebar unchanged; owned Escape closes it", async t => {
  const h = await setup(t, false); await h.emit(h.doc, "keydown", { key: "Escape" }); assert.deepEqual(h.changes, []);
  h.doc.activeElement = h.root; await h.emit(h.doc, "keydown", { key: "Escape" }); assert.deepEqual(h.changes, [true]);
});

test("owned popups may consume Escape and right-click context menus stay available", async t => {
  const h = await setup(t, false); h.doc.activeElement = h.popup;
  const event = Object.assign(new Event("keydown", { cancelable: true }), { key: "Escape" });
  event.preventDefault(); await act(async () => { h.doc.dispatchEvent(event); }); assert.deepEqual(h.changes, []);
  assert.equal((await h.emit(h.root, "contextmenu")).defaultPrevented, false);
});

test("resize boundary drag works immediately and boundary hover does not reopen a closed rail", async t => {
  const h = await setup(t, false); const captures: number[] = [];
  const edge = { closest: (selector: string) => selector === "[data-sidebar-resize]" ? edge : null, setPointerCapture: (id: number) => captures.push(id), hasPointerCapture: () => true, releasePointerCapture: (id: number) => captures.push(-id) };
  await h.emit(h.root, "pointerdown", { target: edge, clientX: 238 });
  await h.emit(h.win, "pointermove", { clientX: 180 }); await h.emit(h.win, "pointerup", { clientX: 180 });
  assert.equal(h.collapsed(), true); assert.deepEqual(h.changes, [true]); assert.deepEqual(captures, [1, -1]);
  await h.emit(h.root, "pointerleave"); await h.emit(h.root, "pointerenter");
  await h.emit(h.root, "pointerover", { target: edge }); await h.tick(120);
  assert.equal(h.collapsed(), true); assert.deepEqual(h.changes, [true]);
});

test("owned portal menus preserve the peek until pointer and focus leave navigation", async t => {
  const h = await setup(t, false); await h.emit(h.root, "pointerenter"); await h.tick(120);
  await h.emit(h.root, "pointerleave", { relatedTarget: h.popup }); await h.tick(250);
  assert.equal(h.reveal().revealed, true);
  await h.emit(h.doc, "pointerover"); await h.tick(200); assert.equal(h.reveal().revealed, false);
  assert.deepEqual(h.changes, []);
});

test("pressing the body cannot reveal a disabled rail before the open gesture commits", async t => {
  const h = await setup(t); await h.emit(h.root, "pointerenter");
  await h.emit(h.root, "pointerdown", { clientX: 10 }); await h.emit(h.root, "focusin"); await h.tick(180);
  assert.equal(h.reveal().revealed, false);
  await h.emit(h.win, "pointermove", { clientX: 90 }); await h.emit(h.win, "pointerup", { clientX: 90 });
  assert.equal(h.collapsed(), false); assert.equal(h.reveal().revealed, true); assert.deepEqual(h.changes, [false]);
});

for (const id of ["nav-account", "nav-notifications"]) test(`${id} hover/focus and its portal never reveal the main sidebar`, async t => {
  const h = await setup(t, false), item = h.independent.find(value => value.id === id)!;
  await h.emit(h.root, "pointerenter"); await h.emit(h.root, "pointerover", { target: item.control }); await h.tick(120);
  assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "focusin", { target: item.control }); assert.equal(h.reveal().revealed, false);
  await h.emit(h.doc, "pointerover", { target: item.panel }); await h.emit(h.doc, "focusin", { target: item.panel }); await h.tick(250);
  assert.equal(h.reveal().revealed, false); assert.deepEqual(h.changes, []);
  await h.emit(h.root, "pointerover"); await h.tick(120); assert.equal(h.reveal().revealed, true);
  await h.emit(h.root, "pointerover", { target: item.control }); assert.equal(h.reveal().revealed, false);
  await h.emit(h.root, "pointerenter"); await h.tick(120); assert.equal(h.reveal().revealed, false);
});
