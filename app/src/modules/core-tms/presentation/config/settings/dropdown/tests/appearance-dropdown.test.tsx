import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { AppearanceDropdown } from "../AppearanceDropdown";

function setup() {
  const listeners = new Map<string, Set<(event: { target: unknown }) => void>>();
  const document = {
    activeElement: null as unknown,
    addEventListener(name: string, fn: (event: { target: unknown }) => void) {
      const set = listeners.get(name) ?? new Set(); set.add(fn); listeners.set(name, set);
    },
    removeEventListener(name: string, fn: (event: { target: unknown }) => void) { listeners.get(name)?.delete(fn); },
  };
  let popover = false;
  const trigger = { contains: (target: unknown) => target === trigger, focus: () => { document.activeElement = trigger; },
    getBoundingClientRect: () => ({ left: 20, top: 10, width: 150, height: 34, bottom: 44 }) };
  const menu = { dataset: {}, style: {}, scrollHeight: 80, showPopover: () => { popover = true; },
    hidePopover: () => { popover = false; }, matches: () => popover };
  const root = { contains: (target: unknown) => target === trigger || target === menu };
  const modules = new Map<string, unknown>();
  function load(url: URL): unknown {
    if (modules.has(url.href)) return modules.get(url.href);
    const module = { exports: {} };
    runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { module, exports: module.exports, document, Element: class Element {}, innerWidth: 1000, innerHeight: 800,
      window: { addEventListener() {}, removeEventListener() {} },
      require: (name: string) => {
        if (name === "react") return React;
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_object, key) => String(key) }) };
        if (name.endsWith("/Icon")) return { Check: () => <svg data-icon="check" />, ChevronDown: () => <svg /> };
        return load(new URL(`${name}.ts`, url));
      },
    });
    modules.set(url.href, module.exports); return module.exports;
  }
  const { AppearanceDropdown: Dropdown } = load(new URL("../AppearanceDropdown.tsx", import.meta.url)) as { AppearanceDropdown: typeof AppearanceDropdown };
  const changes: { value: string; origin: { x: number; y: number } }[] = [];
  let rendered: ReactTestRenderer;
  act(() => { rendered = create(<Dropdown id="theme" labelledBy="theme-label" describedBy="theme-hint" value="light"
    options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
    onChange={(value, origin) => changes.push({ value, origin })} />, {
    createNodeMock: element => element.props.role === "combobox" ? trigger : element.props.role === "listbox" ? menu : root,
  }); });
  trigger.focus();
  const control = () => rendered!.root.findByProps({ role: "combobox" });
  const options = () => rendered!.root.findAllByProps({ role: "option" });
  const press = (key: string) => {
    let prevented = false;
    act(() => control().props.onKeyDown({ key, preventDefault: () => { prevented = true; }, stopPropagation() {} }));
    return prevented;
  };
  return { control, options, press, changes, trigger, document, menu,
    click: () => act(() => control().props.onClick()),
    outside: (target: unknown) => act(() => listeners.get("pointerdown")?.forEach(fn => fn({ target }))),
    popover: () => popover,
    dispose: () => act(() => rendered!.unmount()),
    listenerCount: () => listeners.get("pointerdown")?.size ?? 0 };
}

test("appearance dropdown opens on click, marks the selected option and preserves focus on pointer selection", () => {
  const h = setup();
  try {
    assert.equal(h.control().props["aria-labelledby"], "theme-label");
    assert.equal(h.control().props["aria-describedby"], "theme-hint");
    assert.equal(h.control().props["aria-expanded"], false);
    h.click();
    assert.equal(h.control().props["aria-expanded"], true); assert.equal(h.popover(), true);
    assert.equal(h.options()[0].props["aria-selected"], true);
    assert.equal(h.options()[1].props["aria-selected"], false);
    assert.equal(h.options()[0].findAllByProps({ "data-icon": "check" }).length, 1);
    let prevented = false;
    act(() => h.options()[1].props.onPointerDown({ preventDefault: () => { prevented = true; } }));
    assert.equal(prevented, true);
    act(() => h.options()[1].props.onClick());
    assert.equal(h.changes[0].value, "dark");
    assert.deepEqual({ ...h.changes[0].origin }, { x: 95, y: 27 });
    assert.equal(h.document.activeElement, h.trigger);
    assert.equal(h.control().props["aria-expanded"], false); assert.equal(h.popover(), false);
  } finally { h.dispose(); }
});

test("appearance dropdown arrows, Home and End navigate without applying until Enter", () => {
  const h = setup();
  try {
    assert.equal(h.press("ArrowDown"), true);
    assert.equal(h.control().props["aria-activedescendant"], "theme-listbox-option-0");
    h.press("ArrowDown");
    assert.equal(h.control().props["aria-activedescendant"], "theme-listbox-option-1");
    h.press("ArrowUp");
    assert.equal(h.control().props["aria-activedescendant"], "theme-listbox-option-0");
    h.press("End");
    assert.equal(h.control().props["aria-activedescendant"], "theme-listbox-option-1");
    h.press("Home");
    assert.equal(h.control().props["aria-activedescendant"], "theme-listbox-option-0");
    assert.equal(h.changes.length, 0);
    h.press("End"); h.press("Enter");
    assert.equal(h.changes[0].value, "dark");
    assert.equal(h.document.activeElement, h.trigger);
    assert.equal(h.control().props["aria-expanded"], false);
  } finally { h.dispose(); }
});

test("appearance dropdown Escape, Tab, outside pointer and blur dismiss without changing the value", () => {
  const h = setup();
  try {
    h.press("Enter"); assert.equal(h.control().props["aria-expanded"], true);
    assert.equal(h.press("Escape"), true); assert.equal(h.control().props["aria-expanded"], false);
    h.click(); assert.equal(h.press("Tab"), false); assert.equal(h.control().props["aria-expanded"], false);
    h.click(); h.outside(h.menu); assert.equal(h.control().props["aria-expanded"], true);
    h.outside({}); assert.equal(h.control().props["aria-expanded"], false);
    h.click();
    act(() => h.control().props.onBlur({ relatedTarget: {} }));
    assert.equal(h.control().props["aria-expanded"], false);
    assert.equal(h.changes.length, 0);
  } finally { h.dispose(); }
  assert.equal(h.listenerCount(), 0);
});
