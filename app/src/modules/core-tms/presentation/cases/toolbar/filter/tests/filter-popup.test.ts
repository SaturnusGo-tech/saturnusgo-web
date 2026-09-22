import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import type { useFilterPopup } from "../useFilterPopup";

function popup(viewport = { width: 900, height: 700 }, bounds = { left: 760, top: 600, bottom: 628 }) {
  const listeners = new Map<string, (event: unknown) => void>();
  let cleanup: (() => void) | undefined, reference: { current: unknown } | undefined;
  let shown = 0, hidden = 0, focused = 0, disconnected = 0, onResize: (() => void) | undefined;
  const inside = {}, outside = {};
  const trigger = { getBoundingClientRect: () => bounds, contains: (target: unknown) => target === trigger };
  const element = {
    style: {} as Record<string, string>, parentElement: { querySelector: () => trigger },
    showPopover: () => { shown++; }, hidePopover: () => { hidden++; }, matches: () => true,
    getBoundingClientRect: () => ({ height: 300 }), contains: (target: unknown) => target === inside,
    querySelector: () => ({ focus: () => { focused++; } }),
  };
  const module = { exports: {} };
  const globals = { module, exports: module.exports, innerWidth: viewport.width, innerHeight: viewport.height,
    ResizeObserver: class {
      constructor(callback: () => void) { onResize = callback; }
      observe() {}
      disconnect() { disconnected++; }
    },
    window: {
      addEventListener: (name: string, callback: (event: unknown) => void) => listeners.set(`window:${name}`, callback),
      removeEventListener: (name: string) => listeners.delete(`window:${name}`),
    },
    document: {
      addEventListener: (name: string, callback: (event: unknown) => void) => listeners.set(`document:${name}`, callback),
      removeEventListener: (name: string) => listeners.delete(`document:${name}`),
    },
    require: (name: string) => {
      assert.equal(name, "react");
      return {
        useRef: (value: unknown) => reference ??= { current: value },
        useLayoutEffect: (effect: () => () => void) => { cleanup ??= effect(); },
      };
    },
  };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../useFilterPopup.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText, globals);
  const hook = (module.exports as { useFilterPopup: typeof useFilterPopup }).useFilterPopup;
  const panel = { current: element as unknown as HTMLDivElement };
  return {
    render: (onClose: () => void) => hook(panel, onClose), style: element.style, inside, outside, trigger,
    emit: (name: string, target: unknown) => listeners.get(`document:${name}`)?.({ target }),
    resize: (width: number, height: number) => { globals.innerWidth = width; globals.innerHeight = height; onResize?.(); },
    dispose: () => cleanup?.(), stats: () => ({ shown, hidden, focused, disconnected, listeners: listeners.size }),
  };
}

test("filter popup opens above a low trigger and stays inside the viewport when resized", () => {
  const h = popup(); h.render(() => {});
  assert.deepEqual(h.style, { width: "520px", maxHeight: "480px", left: "368px", top: "292px" });
  assert.equal(h.stats().shown, 1); assert.equal(h.stats().focused, 1);
  h.resize(400, 700);
  assert.equal(h.style.width, "376px"); assert.equal(h.style.left, "12px");
  h.dispose();
});

test("filter popup closes only outside its panel and trigger and uses the latest callback", () => {
  const h = popup(); let first = 0, latest = 0;
  h.render(() => { first++; });
  h.emit("pointerdown", h.inside); h.emit("focusin", h.trigger);
  assert.equal(first, 0);
  h.render(() => { latest++; });
  h.emit("pointerdown", h.outside);
  assert.equal(first, 0); assert.equal(latest, 1);
  h.dispose();
  assert.deepEqual(h.stats(), { shown: 1, hidden: 1, focused: 1, disconnected: 1, listeners: 0 });
  h.emit("focusin", h.outside);
  assert.equal(latest, 1);
});

test("short viewports use the full available height instead of clipping the footer between anchor and edge", () => {
  const h = popup({ width: 390, height: 360 }, { left: 330, top: 170, bottom: 198 });
  h.render(() => {});
  assert.equal(h.style.top, "12px");
  assert.equal(h.style.maxHeight, "336px");
  assert.equal(h.style.left, "12px");
  assert.equal(h.style.width, "366px");
  h.dispose();
});
