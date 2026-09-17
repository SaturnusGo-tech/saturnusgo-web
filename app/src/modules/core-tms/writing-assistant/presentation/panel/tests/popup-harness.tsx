import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TestContext } from "node:test";
import { useWritingPopup } from "../useWritingPopup";

Object.assign(globalThis, { React });

export function popupHarness(t: TestContext) {
  const viewport = Object.assign(new EventTarget(), { offsetLeft: 0, offsetTop: 0, width: 1200, height: 800 });
  const window = Object.assign(new EventTarget(), { innerWidth: 1200, innerHeight: 800, visualViewport: viewport });
  const document = Object.assign(new EventTarget(), { hidden: false });
  let resize = () => {}, closed = 0, captured: number | null = null;
  let state!: ReturnType<typeof useWritingPopup>, tree!: ReactTestRenderer;
  const box = { width: 560, height: 220 }, origin = { left: 500, bottom: 100 };
  const node = { get offsetLeft() { return state.position.left; }, get offsetTop() { return state.position.top; },
    get offsetWidth() { return Math.min(box.width, viewport.width - 24); }, get offsetHeight() { return Math.min(box.height, viewport.height - 24); },
    contains: (target: unknown) => target === node, querySelector: () => null };
  const handle = { setPointerCapture: (id: number) => { captured = id; }, hasPointerCapture: (id: number) => captured === id,
    releasePointerCapture: () => { captured = null; } };
  const anchor = { current: { getBoundingClientRect: () => origin, contains: () => false } as unknown as HTMLButtonElement };
  const replacements = { window, document, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    ResizeObserver: class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} } };
  const originals = new Map(Object.keys(replacements).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  t.mock.timers.enable({ apis: ["setTimeout"] });
  function Probe({ enabled = true }: { enabled?: boolean }) { state = useWritingPopup(anchor, () => { closed++; }, enabled); return <div ref={state.panel} />; }
  act(() => { tree = create(<Probe />, { createNodeMock: () => node }); });
  t.after(() => {
    act(() => tree.unmount());
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const event = (x: number, y: number, id = 1) => ({ clientX: x, clientY: y, pointerId: id, button: 0, isPrimary: true,
    currentTarget: handle, preventDefault() {}, stopPropagation() {} });
  return { get: () => state, box, origin, viewport, closed: () => closed, captured: () => captured,
    down: (x = 550, y = 130, id = 1) => act(() => state.handle.onPointerDown(event(x, y, id) as never)),
    move: (x: number, y: number, id = 1) => act(() => state.handle.onPointerMove(event(x, y, id) as never)),
    up: (id = 1) => act(() => state.handle.onPointerUp(event(0, 0, id) as never)),
    cancel: () => act(() => state.handle.onPointerCancel(event(0, 0) as never)),
    lost: () => act(() => state.handle.onLostPointerCapture(event(0, 0) as never)),
    hold: () => act(() => t.mock.timers.tick(350)),
    resize: () => act(() => resize()),
    scroll: () => act(() => { window.dispatchEvent(new Event("scroll")); }),
    blur: () => act(() => { window.dispatchEvent(new Event("blur")); }),
    hide: () => act(() => { document.hidden = true; document.dispatchEvent(new Event("visibilitychange")); }),
    disable: () => act(() => tree.update(<Probe enabled={false} />)),
    key: (key: string, shiftKey = false) => act(() => state.handle.onKeyDown({ key, shiftKey, preventDefault() {}, stopPropagation() {} } as never)),
  };
}
