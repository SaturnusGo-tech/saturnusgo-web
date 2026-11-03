import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("workspace page hides only source siblings, restores accessibility and respects navigation focus", () => {
  class Element {
    inert = false; isConnected = true; attributes = new Map<string, string>();
    getAttribute(key: string) { return this.attributes.get(key) ?? null; }
    setAttribute(key: string, value: string) { this.attributes.set(key, value); }
    removeAttribute(key: string) { this.attributes.delete(key); }
  }
  for (const navigated of [false, true]) {
    let focused = 0, refs = 0; const effects: (() => void | (() => void))[] = [];
    const source = new Element(), previouslyHidden = new Element(); previouslyHidden.inert = true; previouslyHidden.setAttribute("aria-hidden", "false");
    const target = { style: { position: "" }, children: [source, previouslyHidden] };
    const dockStyle = { display: "flex", priority: "important", getPropertyValue: () => dockStyle.display, getPropertyPriority: () => dockStyle.priority,
      setProperty: (_key: string, value: string, priority = "") => { dockStyle.display = value; dockStyle.priority = priority; }, removeProperty: () => { dockStyle.display = ""; dockStyle.priority = ""; } };
    const dock = Object.assign(new Element(), { style: dockStyle });
    const app = { querySelector: (selector: string) => selector === "[data-verification-dock]" ? dock : target }, anchor = { closest: () => app };
    const origin = { isConnected: true, closest: () => null, focus: () => focused++ };
    const window = { location: { href: "https://falcon.test/?view=reports" } };
    const module = { exports: {} as { DefectPageHost: (props: unknown) => unknown } };
    const react = { useRef: (initial: unknown) => ({ current: refs++ === 0 ? anchor : initial }), useState: () => [null, () => undefined],
      useLayoutEffect: (effect: () => void | (() => void)) => effects.push(effect), useEffect() {} };
    const jsx = () => null;
    runInNewContext(ts.transpileModule(readFileSync(new URL("../DefectPageHost.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX } }).outputText,
      { module, exports: module.exports, HTMLElement: Element, document: { activeElement: origin }, window, getComputedStyle: () => ({ position: "static" }),
        require: (name: string) => name === "react" ? react : name === "react/jsx-runtime" ? { jsx, jsxs: jsx } : name === "react-dom" ? { createPortal: jsx } : { default: { app: "app" } } });
    module.exports.DefectPageHost({ children: "form", onNavigate() {}, pending: false });
    const cleanup = effects[0](); assert.equal(typeof cleanup, "function");
    assert.equal(source.inert, true); assert.equal(source.getAttribute("aria-hidden"), "true");
    assert.equal(dock.inert, true); assert.equal(dock.getAttribute("aria-hidden"), "true"); assert.equal(dockStyle.display, "none");
    assert.equal(target.style.position, "relative"); assert.equal("inert" in target, false);
    if (navigated) window.location.href = "https://falcon.test/?view=cases";
    cleanup?.(); assert.equal(source.inert, false); assert.equal(source.getAttribute("aria-hidden"), null);
    assert.equal(previouslyHidden.inert, true); assert.equal(previouslyHidden.getAttribute("aria-hidden"), "false");
    assert.equal(dock.inert, false); assert.equal(dock.getAttribute("aria-hidden"), null); assert.equal(dockStyle.display, "flex"); assert.equal(dockStyle.priority, "important");
    assert.equal(target.style.position, ""); assert.equal(focused, navigated ? 0 : 1);
  }
});
