import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ScenarioMarkdownInput } from "../ScenarioMarkdownInput";
import { useStepHistory } from "../history/useStepHistory";

function load() {
  const module = { exports: {} as { ScenarioMarkdownInput: typeof ScenarioMarkdownInput } };
  const stub = (type: string) => (props: React.PropsWithChildren) => React.createElement(type, props, props.children);
  runInNewContext(ts.transpileModule(readFileSync(new URL("../ScenarioMarkdownInput.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, requestAnimationFrame: (callback: () => void) => callback(),
    window: { getSelection: () => null }, require(name: string) {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name.endsWith("useStepHistory")) return { useStepHistory };
      if (name.endsWith("useScenarioWriting")) return { useScenarioWriting: () => () => null };
      if (name.endsWith("useTextareaEmoji")) return { useTextareaEmoji: () => ({ remember() {}, insert() {} }) };
      return new Proxy({}, { get: (_, key) => stub(String(key)) });
    } });
  return module.exports.ScenarioMarkdownInput;
}
const Field = load();
const props = { value: "**Existing result**", label: "Actual result", placeholder: "What happened", ru: false, onChange() {} };
async function render(t: TestContext, hideEditButton?: boolean, footerOnlyWhileEditing?: boolean) {
  let tree!: ReactTestRenderer;
  await act(async () => { tree = create(<Field {...props} hideEditButton={hideEditButton} footerOnlyWhileEditing={footerOnlyWhileEditing} />); });
  t.after(async () => { await act(async () => tree.unmount()); });
  return tree;
}

test("existing scenario fields retain the pencil action by default", async t => {
  const tree = await render(t);
  assert.equal(tree.root.findAllByProps({ "aria-label": "Edit: Actual result" }).length, 1);
  assert.equal(tree.root.findByProps({ className: "preview" }).props.role, undefined);
  assert.equal(tree.root.findAll(node => String(node.type) === "EmojiButton").length, 1);
});

test("opting out of the pencil leaves a labelled keyboard edit target", async t => {
  const tree = await render(t, true);
  assert.equal(tree.root.findAllByProps({ "aria-label": "Edit: Actual result", type: "button" }).length, 0);
  const preview = tree.root.findByProps({ className: "preview" });
  assert.equal(preview.props.role, "button");
  assert.equal(preview.props.tabIndex, 0);
  assert.equal(preview.props["aria-label"], "Edit: Actual result");
});

for (const key of ["Enter", " "]) test(`the pencil-free preview opens editing on ${JSON.stringify(key)}`, async t => {
  const tree = await render(t, true);
  const preview = tree.root.findByProps({ className: "preview" });
  assert.equal(typeof preview.props.onKeyDown, "function");
  let prevented = false;
  await act(async () => { preview.props.onKeyDown({ key, target: { closest: () => null }, preventDefault() { prevented = true; } }); });
  assert.equal(prevented, true);
  assert.equal(tree.root.findByType("textarea").props.hidden, false);
});

test("keyboard activation inside a nested link or button does not enter editing", async t => {
  const tree = await render(t, true);
  const preview = tree.root.findByProps({ className: "preview" });
  assert.equal(typeof preview.props.onKeyDown, "function");
  let prevented = false;
  await act(async () => { preview.props.onKeyDown({ key: "Enter", target: { closest: () => ({}) }, preventDefault() { prevented = true; } }); });
  assert.equal(prevented, false);
  assert.equal(tree.root.findByType("textarea").props.hidden, true);
});


test("the editing-only footer appears on focus and disappears after leaving the field", async t => {
  const tree = await render(t, true, true);
  assert.equal(tree.root.findAll(node => String(node.type) === "EmojiButton").length, 0);
  await act(async () => tree.root.findByType("textarea").props.onFocus());
  assert.equal(tree.root.findAll(node => String(node.type) === "EmojiButton").length, 1);
  await act(async () => tree.root.findByProps({ className: "input" }).props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null }));
  assert.equal(tree.root.findAll(node => String(node.type) === "EmojiButton").length, 0);
});

test("an open emoji picker retains the editing-only footer until it closes", async t => {
  const tree = await render(t, true, true);
  await act(async () => tree.root.findByType("textarea").props.onFocus());
  await act(async () => tree.root.find(node => String(node.type) === "EmojiButton").props.onOpenChange(true));
  await act(async () => tree.root.findByProps({ "aria-label": "Show formatted text" }).props.onClick());
  assert.equal(tree.root.findByType("textarea").props.hidden, true);
  assert.equal(tree.root.findAll(node => String(node.type) === "EmojiButton").length, 1);
  await act(async () => tree.root.find(node => String(node.type) === "EmojiButton").props.onOpenChange(false));
  assert.equal(tree.root.findAll(node => String(node.type) === "EmojiButton").length, 0);
});
