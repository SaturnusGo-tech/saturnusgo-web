import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create, type ReactTestRenderer, type ReactTestInstance } from "react-test-renderer";
import ts from "typescript";
import type { SuiteCasePicker, SuiteCasePickerProps } from "../SuiteCasePicker";
import * as model from "../model/picker-model";

function setup(readonly = false, overrides: Partial<SuiteCasePickerProps> = {}) {
  const modules = new Map<string, unknown>();
  function load(url: URL): unknown {
    if (modules.has(url.href)) return modules.get(url.href);
    const module = { exports: {} };
    runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { module, exports: module.exports,
      require: (name: string) => {
        if (name === "react") return React;
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_object, key) => String(key) }) };
        if (name.endsWith("/Icon")) return new Proxy({}, { get: () => () => <svg /> });
        if (name === "react-icons/pi" || name === "lucide-react" || name === "@heroui/react") return createRequire(import.meta.url)(name);
        if (name.endsWith("picker-model")) return model;
        if (name.endsWith("useAnchoredPopup")) return { useAnchoredPopup() {} };
        const next = [".tsx", ".ts"].map(extension => new URL(`${name}${extension}`, url)).find(value => existsSync(value));
        assert.ok(next, name); return load(next);
      },
    });
    modules.set(url.href, module.exports); return module.exports;
  }
  const { SuiteCasePicker: Picker } = load(new URL("../SuiteCasePicker.tsx", import.meta.url)) as { SuiteCasePicker: typeof SuiteCasePicker };
  const scopes: string[][] = [], toggles: string[] = [], selected = new Set(["unloaded", "a"]);
  const props = {
    ru: false, readonly, projectName: "Synthetic project", selected,
    folders: [{ id: "host", name: "Host", path: "/Host", parentId: null, archivedAt: null },
      { id: "calendar", name: "Calendar", path: "/Host/Calendar", parentId: "host", archivedAt: null }],
    cases: [{ id: "a", key: "QA-1", title: "Sign in", folderId: "host", folderPath: "/Host", priority: "high", tags: [], archivedAt: null },
      { id: "b", key: "QA-2", title: "Create booking", folderId: "calendar", folderPath: "/Host/Calendar", priority: "medium", tags: [], archivedAt: null },
      { id: "c", key: "QA-3", title: "Sign out", folderId: null, folderPath: "/", priority: "low", tags: [], archivedAt: null }],
    onScope: (ids: readonly string[]) => scopes.push([...ids]), onToggle: (id: string) => toggles.push(id),
    ...overrides,
  } as unknown as SuiteCasePickerProps;
  let view: ReactTestRenderer;
  act(() => { view = create(<Picker {...props} />, { createNodeMock: () => ({ open: false, indeterminate: false }) }); });
  return { root: () => view!.root, scopes, toggles, selected,
    clickFolder: (title: string) => act(() => view!.root.findAll(node => node.type === "button" && node.props.title === title)[0].props.onClick()),
    search: (value: string) => act(() => view!.root.findByProps({ type: "search" }).props.onChange({ target: { value } })),
    dispose: () => act(() => view!.unmount()) };
}

test("browsing a parent and searching selects visible descendant cases only, retaining unseen membership", () => {
  const h = setup();
  try {
    h.clickFolder("/Host");
    const scope = () => h.root().findByProps({ "aria-label": "Select visible cases" });
    act(() => scope().props.onChange()); assert.deepEqual(h.scopes, [["a", "b"]]);
    h.search("booking");
    act(() => scope().props.onChange()); assert.deepEqual(h.scopes[1], ["b"]);
    act(() => h.root().findByProps({ "aria-label": "Select QA-2: Create booking" }).props.onChange());
    assert.deepEqual(h.toggles, ["b"]); assert.deepEqual([...h.selected], ["unloaded", "a"]);
    h.search("no results"); assert.equal(scope().props.disabled, true);
    assert.equal(h.root().findAllByProps({ className: "empty" }).length, 1);
  } finally { h.dispose(); }
});
test("dynamic previews browse and filter the same cases without editable selection controls", () => {
  const h = setup(true);
  try {
    assert.equal(h.root().findAllByProps({ type: "checkbox" }).length, 0);
    h.clickFolder("/Host/Calendar"); h.search("booking");
    assert.equal(h.root().findAllByProps({ className: "caseTitle" }).length, 1);
    assert.deepEqual(h.scopes, []); assert.deepEqual(h.toggles, []);
  } finally { h.dispose(); }
});
test("case and current-folder breadcrumbs keep full path tooltips and localize the unfiled root", () => {
  const h = setup(true);
  const text = (node: ReactTestInstance | string): string => typeof node === "string" ? node : node.children.map(text).join("");
  try {
    h.clickFolder("/Host/Calendar");
    const current = h.root().findByProps({ className: "scopeName" });
    assert.equal(current.props.title, "/Host/Calendar"); assert.equal(text(current), "HostCalendar");
    const casePath = h.root().findByProps({ className: "caseFolder" });
    assert.equal(casePath.props.title, "/Host/Calendar"); assert.equal(text(casePath), "HostCalendar");
    h.clickFolder("/");
    assert.equal(text(h.root().findByProps({ className: "scopeName" })), "Unfiled");
    assert.equal(text(h.root().findByProps({ className: "caseFolder" })), "Unfiled");
    assert.equal(h.root().findByProps({ className: "caseFolder" }).props.title, "/");
    assert.deepEqual(h.scopes, []); assert.deepEqual(h.toggles, []);
  } finally { h.dispose(); }
});

test("an empty Related Cases picker explains how to link cases to the article", () => {
  const h = setup(false, { purpose: "related-cases", cases: [], folders: [] });
  try {
    const empty = h.root().findByProps({ className: "empty" });
    assert.equal(empty.findByType("p").children.join(""), "Add test cases to the project to link them to this article.");
    assert.equal(h.root().findByProps({ "aria-label": "Select visible cases" }).props.disabled, true);
    assert.deepEqual(h.scopes, []);
  } finally { h.dispose(); }
});
