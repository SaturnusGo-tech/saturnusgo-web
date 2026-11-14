import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Details: typeof import("../../../presentation/source-reader/SourceDetails")["SourceDetails"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Details = require("../../../presentation/source-reader/SourceDetails").SourceDetails; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
const source = { id: "s", name: "Customers", description: "Synthetic", kind: "FILE" as const, status: "ACTIVE" as const, revision: 4, tableName: "", columns: [], rowCount: 0, createdAt: "now", updatedAt: "now" };
test("source metadata edits use the current revision and refresh only after the API accepts them", async () => {
  const calls: unknown[] = []; let updated = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: { updateSource: async (...args: unknown[]) => { calls.push(args); return { ...source, name: "Boundary customers", revision: 5 }; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={source} ru={false} onClose={() => {}} onUpdated={() => updated++} /></TestDataProvider>); });
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Edit source")!.props.onPress());
  await act(async () => view!.root.findAllByType("input").find(input => input.props["aria-label"] === "Source name")!.props.onValueChange("Boundary customers"));
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.equal(calls[0] instanceof Array, true); assert.deepEqual((calls[0] as unknown[])[0], source); assert.deepEqual((calls[0] as unknown[])[1], { name: "Boundary customers", description: "Synthetic" }); assert.equal(updated, 1);
  await act(async () => view!.unmount());
});
test("opening a database source leaves SQL empty until a real remote table is specified", async () => {
  let queries = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true }, workspace: { query: async () => { queries++; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={{ ...source, kind: "POSTGRES", tableName: "source_logical_id" }} ru={false} onClose={() => {}} onUpdated={() => {}} /></TestDataProvider>); });
  assert.equal(queries, 0);
  assert.equal(view!.root.findAllByProps({ label: "SQL query" }).length, 0);
  assert.equal(view!.root.findAllByProps({ "aria-label": "SQL query" }).length, 0);
  assert.equal(view!.root.findAllByProps({ "aria-label": "Refresh source" }).length, 0);
  await act(async () => view!.unmount());
});

test("file sources use the compact file toolbar without a redundant status strip or SQL editor", async () => {
  let view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: {} } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={source} ru={false} onClose={() => {}} onUpdated={() => {}} /></TestDataProvider>); });
  assert.ok(view!.root.findAllByType("span").some(node => text(node) === "File"));
  assert.ok(view!.root.findAllByType("button").some(node => text(node) === "Change"));
  assert.equal(view!.root.findAllByProps({ label: "SQL query" }).length, 0);
  assert.equal(view!.root.findAllByType("span").some(node => text(node) === "Active"), false);
  await act(async () => view!.unmount());
});
