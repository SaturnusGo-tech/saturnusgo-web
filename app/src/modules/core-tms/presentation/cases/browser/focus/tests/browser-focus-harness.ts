import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { useCaseBrowserFocus } from "../../layout/useCaseBrowserFocus";

export function browserFocusHarness() {
  const document: { activeElement: Element | null; body: Element | null } = { activeElement: null, body: null };
  class Element {
    visible = true; isConnected = true; children: Element[] = []; focused = 0;
    getClientRects() { return this.visible && this.isConnected ? [{}] : []; }
    contains(value: Element | null) { return value === this || this.children.includes(value!); }
    querySelector() { return this.children[0] ?? null; }
    focus() { this.focused++; document.activeElement = this; }
  }
  const workspace = new Element(), tree = new Element(), panel = new Element(), leaf = new Element(), fallback = new Element(), outside = new Element();
  document.body = new Element(); document.activeElement = document.body;
  workspace.children = [tree]; tree.children = [fallback, leaf];
  const refs = [{ current: workspace }, { current: panel }];
  const slots: { current: unknown }[] = []; let cursor = 0;
  let nextEffect: (() => void | (() => void)) | undefined, cleanup: (() => void) | undefined;
  const frames = new Map<number, () => void>(); let id = 0;
  const observers = new Set<() => void>();
  const module = { exports: {} as { useCaseBrowserFocus: typeof useCaseBrowserFocus } };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../../layout/useCaseBrowserFocus.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText, { module, exports: module.exports, document, HTMLElement: Element,
    requestAnimationFrame: (fn: () => void) => { frames.set(++id, fn); return id; }, cancelAnimationFrame: (key: number) => frames.delete(key),
    ResizeObserver: class { constructor(private callback: () => void) {} observe() { observers.add(this.callback); } disconnect() { observers.delete(this.callback); } },
    require: () => ({ useRef(value: unknown) { const index = cursor++; slots[index] ??= { current: value }; return slots[index]; },
      useEffect(effect: () => void | (() => void)) { nextEffect = effect; } }),
  });
  let capture: ReturnType<typeof useCaseBrowserFocus>;
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn()); };
  function render(open: boolean, fullscreen = false) {
    cleanup?.(); cursor = 0;
    capture = module.exports.useCaseBrowserFocus(true, open, fullscreen, refs[0] as never, refs[1] as never);
    cleanup = nextEffect?.() || undefined; flush();
  }
  return { workspace, tree, panel, leaf, fallback, outside, document, render, flush,
    focusLeaf() { leaf.focus(); capture({ target: leaf } as never); },
    resize() { observers.forEach((callback) => callback()); flush(); }, dispose() { cleanup?.(); },
  };
}
