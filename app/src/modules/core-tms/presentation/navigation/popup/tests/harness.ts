import { type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useRailPopup } from "../useRailPopup";

export async function popupHarness(t: TestContext, count = 1) {
  const keys = ["window", "document", "setTimeout", "clearTimeout", "getComputedStyle", "ResizeObserver"];
  const descriptors = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const win = Object.assign(new EventTarget(), { innerWidth: 800, innerHeight: 600 });
  const doc = Object.assign(new EventTarget(), { activeElement: null as unknown });
  let now = 0, serial = 0, restored = 0;
  const timers = new Map<number, { at: number; run: () => void }>();
  const resizes = new Set<() => void>();
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: win }, document: { configurable: true, value: doc },
    setTimeout: { configurable: true, value: (run: () => void, delay: number) => {
      const id = ++serial; timers.set(id, { at: now + delay, run }); return id;
    } },
    clearTimeout: { configurable: true, value: (id: number) => timers.delete(id) },
    getComputedStyle: { configurable: true, value: () => ({ getPropertyValue: () => "", fontFamily: "sans-serif", colorScheme: "dark" }) },
    ResizeObserver: { configurable: true, value: class {
      constructor(private callback: () => void) { resizes.add(callback); }
      observe() {} disconnect() { resizes.delete(this.callback); }
    } },
  });
  const items = [0, 1, 2].map(index => ({ index, focused: 0, focus() { this.focused++; doc.activeElement = this; } }));
  const anchor = { top: 100, right: 64, bottom: 144 };
  const trigger = { focus() { restored++; doc.activeElement = this; }, getBoundingClientRect: () => anchor };
  const panel = { height: 180, style: { setProperty() {} } as unknown as CSSStyleDeclaration,
    getBoundingClientRect: () => ({ height: panel.height }), querySelector: () => items[0], querySelectorAll: () => items,
    contains: (target: unknown) => target === panel || items.includes(target as typeof items[number]) };
  const root = { contains: (target: unknown) => target === trigger };
  const states: ReturnType<typeof useRailPopup>[] = [];
  let renderer!: ReactTestRenderer;
  function Probe({ index }: { index: number }) {
    const state = useRailPopup(); states[index] = state;
    state.root.current = root as unknown as HTMLDivElement;
    state.trigger.current = trigger as unknown as HTMLButtonElement;
    state.panel.current = state.open ? panel as unknown as HTMLDivElement : null;
    return null;
  }
  await act(async () => {
    renderer = create(React.createElement(React.Fragment, null,
      ...Array.from({ length: count }, (_, index) => React.createElement(Probe, { index, key: index }))) as Parameters<typeof create>[0]);
  });
  t.after(async () => {
    await act(async () => renderer.unmount());
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  });
  const advance = async (duration: number) => {
    const end = now + duration;
    await act(async () => {
      while (true) {
        const next = [...timers].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].run();
      }
      now = end;
    });
  };
  const emit = async (type: string, target: unknown = doc, emitter = doc as EventTarget) => {
    const event = new Event(type, { cancelable: true }); Object.defineProperty(event, "target", { value: target });
    await act(async () => { emitter.dispatchEvent(event); }); return event;
  };
  const key = (value: string) => ({ key: value, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } });
  return { state: (index = 0) => states[index], advance, emit, key, win, doc, panel, anchor, trigger, items, restored: () => restored, timers, resizes };
}
