import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

export function focusHarness(initialVisible = true) {
  const document: { activeElement: Element | null } = { activeElement: null };
  class Element {
    visible = initialVisible;
    hidden = false;
    isConnected = true;
    inert = false;
    focused = 0;
    children: Element[] = [];
    getClientRects() { return this.visible && this.isConnected ? [{}] : []; }
    querySelectorAll() { return this.children; }
    contains(element: Element) { return this === element || this.children.includes(element); }
    focus() { this.focused++; document.activeElement = this; }
  }
  const panel = new Element(), list = new Element(), tree = new Element(), opener = new Element();
  document.activeElement = opener;
  const first = new Element(), last = new Element(); panel.children = [first, last];
  const listeners = new Map<string, (event: unknown) => void>();
  const frames: (() => void)[] = [];
  let refs = 0;
  let effect: (() => void | (() => void)) | undefined;
  let cleanup: (() => void) | undefined;
  const view = { inspectorOpen: true, detailFullscreen: false, inspectorResize: { overlay: true, handleProps: {} },
    workspaceRef: { current: { querySelector: () => tree } }, bulkSelection: { selected: new Set(), selectedIds: [] } };
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  const module = { exports: {} as { CasesView: (props: unknown) => unknown } };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(ts.transpileModule(readFileSync(new URL("../../../CasesView.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, document, HTMLElement: Element,
    requestAnimationFrame: (callback: () => void) => { frames.push(callback); },
    window: { addEventListener: (name: string, callback: (event: unknown) => void) => listeners.set(name, callback),
      removeEventListener: (name: string) => listeners.delete(name) },
    require(name: string) {
      if (name === "react") return { useEffect: (callback: typeof effect) => { effect = callback; },
        useRef: () => ({ current: [panel, list, null][refs++] }) };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) };
      if (name.endsWith("useCaseBrowserFocus")) return { useCaseBrowserFocus: () => () => {} };
      if (name.endsWith("useCasesViewController")) return { useCasesViewController: () => view };
      if (name.endsWith(".css")) return { default: proxy };
      return proxy;
    },
  });
  module.exports.CasesView({});
  cleanup = effect?.() || undefined;
  return { panel, list, tree, opener, first, last, document,
    hide() { [panel, list, tree, opener, first, last].forEach((element) => { element.visible = false; }); },
    show() { [panel, list, tree, opener, first, last].forEach((element) => { element.visible = true; }); },
    key(shiftKey = false, key = "Tab") { let prevented = 0;
      listeners.get("keydown")?.({ key, shiftKey, preventDefault: () => { prevented++; } }); return prevented; },
    dispose() { cleanup?.(); }, flushFrames() { frames.splice(0).forEach((callback) => callback()); },
  };
}
