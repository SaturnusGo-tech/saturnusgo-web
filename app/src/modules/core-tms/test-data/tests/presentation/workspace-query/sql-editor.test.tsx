import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import { highlightingFor, syntaxTree } from "@codemirror/language";
import { EditorState, type TransactionSpec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { highlightTree, tags } from "@lezer/highlight";
import React from "react";
import { act, create } from "react-test-renderer";

const require = createRequire(import.meta.url), previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Editor: typeof import("../../../presentation/workspace-query/editor/SqlQueryEditor")["SqlQueryEditor"];
let state: EditorState;
before(() => {
  Object.assign(globalThis, { React });
  const loader = require("node:module") as { _load(name: string, parent: NodeModule | undefined, main?: boolean): unknown };
  const previous = loader._load, css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  loader._load = function(name, parent, main) {
    if (name === "@codemirror/language-data") return { languages: [{ name: "SQL", load: async () => (require("@codemirror/lang-sql") as { sql(): unknown }).sql() }] };
    const loaded = previous.call(this, name, parent, main);
    if (name !== "@codemirror/view") return loaded;
    return { ...(loaded as object), EditorView: new Proxy(EditorView, { construct(_target, args) {
      state = args[0].state;
      return { get state() { return state; }, dispatch(spec: TransactionSpec) { state = state.update(spec).state; }, destroy() {} };
    } }) };
  };
  try { Editor = require("../../../presentation/workspace-query/editor/SqlQueryEditor").SqlQueryEditor; }
  finally { loader._load = previous; if (css) require.extensions[".css"] = css; else delete require.extensions[".css"]; }
});
after(() => { if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React"); });
const pause = () => new Promise(resolve => setTimeout(resolve, 30));
const colorFor = (tag: typeof tags.keyword) => {
  const className = highlightingFor(state, [tag]);
  const rules = state.facet(EditorView.styleModule).map(module => module?.getRules()).join("\n");
  return rules.split("\n").find(rule => rule.startsWith(`.${className} `)) ?? "";
};
test("SQL keywords remain visibly pink in both themes instead of inheriting plain text", async () => {
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Editor value={'SELECT * FROM "customers" WHERE age >= 18'} onChange={() => {}} onRun={() => {}} label="SQL query" />, { createNodeMock: () => ({}) }); await pause(); });
  assert.match(colorFor(tags.keyword), /light-dark\(#[a-f\d]{6}, #[a-f\d]{6}\)/i);
  assert.doesNotMatch(colorFor(tags.keyword), /var\(--falcon-text\)/);
  const tokens = new Map<string, string>();
  highlightTree(syntaxTree(state), { style: tokenTags => highlightingFor(state, tokenTags) }, (from, to, style) => tokens.set(state.doc.sliceString(from, to), style));
  assert.equal(tokens.get("SELECT"), highlightingFor(state, [tags.keyword]));
  assert.equal(tokens.get("FROM"), highlightingFor(state, [tags.keyword]));
  assert.notEqual(tokens.get("18"), tokens.get("SELECT"));
  assert.notEqual(tokens.get('"customers"'), tokens.get("SELECT"));
  await act(async () => view!.unmount());
});
test("editing keeps a single CodeMirror document and re-highlights changed SQL", async () => {
  let view: ReturnType<typeof create>;
  const render = (value: string, disabled = false) => <Editor value={value} onChange={() => {}} onRun={() => {}} label="SQL query" disabled={disabled} />;
  await act(async () => { view = create(render("SELECT 1"), { createNodeMock: () => ({}) }); await pause(); });
  await act(async () => { view!.update(render("SELECT name\nFROM customers WHERE active = TRUE", true)); await pause(); });
  assert.equal(state.doc.toString(), "SELECT name\nFROM customers WHERE active = TRUE");
  assert.equal(state.readOnly, true);
  assert.equal(view!.root.findAllByType("div").length, 1);
  assert.equal(view!.root.findAllByType("textarea").length, 0);
  const tokens: string[] = [];
  highlightTree(syntaxTree(state), { style: tokenTags => highlightingFor(state, tokenTags) }, (from, to) => tokens.push(state.doc.sliceString(from, to)));
  assert.ok(tokens.includes("FROM")); assert.ok(tokens.includes("WHERE"));
  await act(async () => view!.unmount());
});
