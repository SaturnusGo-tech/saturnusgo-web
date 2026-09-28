import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TestContext } from "node:test";
import { useInboxPopup } from "../../../presentation/popup/useInboxPopup";

class Element extends EventTarget {
  parent: Element | null = null;
  focused = 0; shown = false;
  style = { width: "", height: "", left: "", top: "", fontFamily: "", fontSize: "", lineHeight: "", colorScheme: "",
    properties: new Map<string, string>(), setProperty(name: string, value: string) { this.properties.set(name, value); } };
  contains(value: unknown): boolean { return value === this || value instanceof Element && Boolean(value.parent && this.contains(value.parent)); }
  focus() { this.focused++; }
  showPopover() { this.shown = true; }
  hidePopover() { this.shown = false; }
  matches() { return this.shown; }
  getBoundingClientRect() { return { right: 80, bottom: 790 }; }
  closest(_selector: string): Element | null { return null; }
  querySelector(_selector: string): Element | null { return null; }
}
export function popupHarness(t: TestContext, native = true, hasApp = true) {
  const window = new EventTarget(), document = Object.assign(new EventTarget(), { body: new Element() });
  const app = new Element(), nav = new Element(), root = new Element(), trigger = new Element(), panel = new Element(), heading = new Element();
  nav.parent = app; root.parent = nav; trigger.parent = root; heading.parent = panel;
  trigger.closest = selector => selector === "nav" ? nav : hasApp ? app : null;
  panel.querySelector = () => heading;
  if (!native) panel.showPopover = undefined as never;
  let disconnected = 0;
  class Observer { constructor(_callback: () => void) {} observe() {} disconnect() { disconnected++; } }
  const values = { window, document, innerWidth: 1440, innerHeight: 900, ResizeObserver: Observer,
    getComputedStyle: () => ({ fontFamily: "Falcon system", fontSize: "14px", lineHeight: "20px", colorScheme: "dark", getPropertyValue: (name: string) => name === "--ink" ? "#eee" : "#171719" }) };
  const descriptors = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  let state!: ReturnType<typeof useInboxPopup>, renderer!: ReactTestRenderer;
  function Probe() {
    state = useInboxPopup(); state.root.current = root as unknown as HTMLDivElement; state.trigger.current = trigger as unknown as HTMLButtonElement;
    state.panel.current = state.open ? panel as unknown as HTMLDivElement : null;
    panel.parent = state.portalHost ? state.portalHost as unknown as Element : root;
    return null;
  }
  act(() => { renderer = create(<Probe/>); });
  const unmount = () => act(() => renderer.unmount());
  t.after(() => { unmount(); for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
  } });
  return { state: () => state, app, panel, trigger, heading, document, window, disconnected: () => disconnected,
    open: () => act(() => state.toggle()), unmount,
    resize: (width: number, height: number) => act(() => { Object.assign(globalThis, { innerWidth: width, innerHeight: height }); window.dispatchEvent(new Event("resize")); }),
    emit: (target: EventTarget, type: string, eventTarget?: unknown, key?: string) => {
      const event = new Event(type, { cancelable: true }); let stopped = false;
      const stop = event.stopPropagation.bind(event); event.stopPropagation = () => { stopped = true; stop(); };
      if (eventTarget) Object.defineProperty(event, "target", { value: eventTarget });
      if (key) Object.defineProperty(event, "key", { value: key });
      act(() => { target.dispatchEvent(event); }); return { event, stopped };
    } };
}
