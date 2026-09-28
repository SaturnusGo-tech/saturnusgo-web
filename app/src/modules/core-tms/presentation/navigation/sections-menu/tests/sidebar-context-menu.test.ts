import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSidebarSectionsPopup } from "../useSidebarSectionsPopup";

async function setup(t: TestContext) {
  const win = new EventTarget(); const doc = new EventTarget();
  const descriptors = new Map(["window", "document", "innerWidth", "innerHeight"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperties(globalThis, { window: { configurable: true, value: win }, document: { configurable: true, value: doc },
    innerWidth: { configurable: true, writable: true, value: 360 }, innerHeight: { configurable: true, writable: true, value: 260 } });
  let restored = 0; let focused = 0; let popover = false;
  const invoker = { isConnected: true, focus() { restored++; }, getBoundingClientRect: () => ({ left: 20, bottom: 55 }) };
  const sidebar = Object.assign(new EventTarget(), { closest: () => invoker, focus() { restored++; } });
  const item = { focus() { focused++; } };
  const panel = { style: {} as Record<string, string>, showPopover() { popover = true; }, hidePopover() { popover = false; },
    matches: () => popover, getBoundingClientRect: () => ({ height: 90 }), querySelector: () => item };
  const popupRoot = { contains: (target: unknown) => target === item || target === panel };
  const sidebarRef = { current: sidebar as unknown as HTMLElement };
  let state!: ReturnType<typeof useSidebarSectionsPopup>; let renderer!: ReactTestRenderer;
  function Probe() {
    state = useSidebarSectionsPopup(sidebarRef);
    state.root.current = popupRoot as unknown as HTMLDivElement;
    state.panel.current = state.popup ? panel as unknown as HTMLDivElement : null;
    return null;
  }
  await act(async () => { renderer = create(React.createElement(Probe) as Parameters<typeof create>[0]); });
  t.after(async () => {
    await act(async () => renderer.unmount());
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  });
  const emit = async (type: string, values: Record<string, unknown> = {}, target = sidebar as EventTarget) => {
    const event = Object.assign(new Event(type, { cancelable: true }), values);
    await act(async () => { target.dispatchEvent(event); }); return event;
  };
  return { state: () => state, panel, item, emit, win, doc, invoker, restored: () => restored, focused: () => focused };
}

test("right-click opens within the viewport and focuses the menu action", async t => {
  const h = await setup(t); const event = await h.emit("contextmenu", { clientX: 355, clientY: 255 });
  assert.equal(event.defaultPrevented, true); assert.equal(h.state().popup?.kind, "context");
  assert.equal(h.panel.style.left, "148px"); assert.equal(h.panel.style.top, "158px");
  assert.equal(h.focused(), 1);
  await act(async () => h.state().openSections());
  assert.equal(h.state().popup?.kind, "sections"); assert.equal(h.panel.style.left, "48px");
  assert.equal(h.focused(), 2);
  await act(async () => h.state().close());
  assert.equal(h.state().popup, null); assert.equal(h.restored(), 1);
});

test("keyboard menu shortcuts anchor to the invoking sidebar item", async t => {
  const h = await setup(t);
  for (const values of [{ key: "ContextMenu" }, { key: "F10", shiftKey: true }]) {
    const event = await h.emit("keydown", values);
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(h.state().popup, { kind: "context", x: 20, y: 55 });
    await act(async () => h.state().close());
  }
  assert.equal(h.restored(), 2);
  const ordinary = await h.emit("keydown", { key: "F10", shiftKey: false });
  assert.equal(ordinary.defaultPrevented, false); assert.equal(h.state().popup, null);
});

test("outside pointer and scrolling dismiss without stealing focus", async t => {
  const h = await setup(t);
  await h.emit("contextmenu", { clientX: 24, clientY: 80 });
  await h.emit("pointerdown", {}, h.doc);
  assert.equal(h.state().popup, null); assert.equal(h.restored(), 0);
  await h.emit("contextmenu", { clientX: 24, clientY: 80 });
  await h.emit("scroll", {}, h.win);
  assert.equal(h.state().popup, null); assert.equal(h.restored(), 0);
});

test("viewport resize clamps an already open dialog", async t => {
  const h = await setup(t);
  await h.emit("contextmenu", { clientX: 355, clientY: 255 });
  await act(async () => h.state().openSections());
  Object.defineProperties(globalThis, { innerWidth: { value: 240 }, innerHeight: { value: 150 } });
  await h.emit("resize", {}, h.win);
  assert.equal(h.panel.style.width, "216px"); assert.equal(h.panel.style.left, "12px");
  assert.equal(h.panel.style.top, "48px"); assert.equal(h.panel.style.maxHeight, "126px");
});
