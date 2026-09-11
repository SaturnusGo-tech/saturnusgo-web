import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { act, create } from "react-test-renderer";
import ts from "typescript";

const module = { exports: {} as { ProjectSelector: React.ComponentType<any> } };
runInNewContext(ts.transpileModule(readFileSync(new URL("../ProjectSelector.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { module, exports: module.exports,
  require: (name: string) => name === "react" ? React : name === "react/jsx-runtime" ? jsx : name === "lucide-react"
    ? { Check: () => null, ChevronDown: () => null, Plus: () => null } : { default: {} },
  document: { addEventListener() {}, removeEventListener() {} }, requestAnimationFrame: () => 0,
});
for (const outcome of [true, false]) test(`project indicator remains busy until navigation resolves ${outcome}`, async () => {
  let finish!: (ok: boolean) => void;
  let calls = 0;
  const props = { activeProjectId: "a", projects: [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }],
    disabled: false, currentProjectLabel: "Project", loadingProjectLabel: "Loading", createProjectLabel: "Create",
    onSelect: () => { calls++; return new Promise<boolean>((resolve) => { finish = resolve; }); }, onCreate() {} };
  const renderer = create(React.createElement(module.exports.ProjectSelector, props) as Parameters<typeof create>[0]);
  const trigger = () => renderer.root.findAllByType("button")[0];
  try {
    act(() => trigger().props.onClick());
    const option = renderer.root.findAllByProps({ role: "menuitemradio" })[1];
    act(() => { option.props.onClick(); option.props.onClick(); });
    assert.equal(calls, 1);
    assert.equal(trigger().props["aria-busy"], true);
    assert.equal(trigger().props.disabled, true);
    assert.equal(renderer.root.findAllByProps({ role: "menu" }).length, 0);
    await act(async () => { finish(outcome); });
    assert.equal(trigger().props["aria-busy"], false);
    assert.equal(trigger().props.disabled, false);
    assert.equal(trigger().props["aria-label"], "Project");
  } finally { act(() => renderer.unmount()); }
});
