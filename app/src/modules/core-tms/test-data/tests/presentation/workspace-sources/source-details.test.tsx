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
test("source inspection has no misleading metadata-only Change action", async () => {
  let closed = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: {} } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={source} ru={false} onClose={() => closed++} onUpdated={() => {}} /></TestDataProvider>); });
  assert.equal(view!.root.findAllByType("button").some(button => text(button) === "Change" || button.props["aria-label"] === "Edit source"), false);
  assert.equal(view!.root.findAllByType("form").length, 0);
  assert.equal(view!.root.findAllByProps({ label: "SQL query" }).length, 1);
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Close source")!.props.onPress());
  assert.equal(closed, 1);
  await act(async () => view!.unmount());
});
test("opening a database source leaves SQL empty until a real remote table is specified", async () => {
  let queries = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true }, workspace: { query: async () => { queries++; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={{ ...source, kind: "POSTGRES", tableName: "source_logical_id" }} ru={false} onClose={() => {}} onUpdated={() => {}} /></TestDataProvider>); });
  assert.equal(queries, 0);
  assert.equal(view!.root.findAllByProps({ label: "SQL query" }).length, 1);
  assert.ok(view!.root.findAllByProps({ "aria-label": "SQL query" }).length > 0);
  assert.equal(view!.root.findAllByProps({ "aria-label": "Refresh source" }).length, 0);
  await act(async () => view!.unmount());
});

test("file sources retain their compact toolbar and expose an editable SQL query", async () => {
  let view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: {} } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={source} ru={false} onClose={() => {}} onUpdated={() => {}} /></TestDataProvider>); });
  assert.ok(view!.root.findAllByType("span").some(node => text(node) === "File"));
  assert.equal(view!.root.findAllByType("button").some(node => text(node) === "Change"), false);
  assert.equal(view!.root.findAllByProps({ label: "SQL query" }).length, 1);
  assert.equal(view!.root.findAllByType("span").some(node => text(node) === "Active"), false);
  await act(async () => view!.unmount());
});

test("database source SQL runs against that source without requiring a saved view", async () => {
  const calls: unknown[] = []; let view: ReturnType<typeof create>;
  const context = { permissions: { read: true }, workspace: { query: async (request: unknown) => { calls.push(request); return { columns: [], rows: [], hasMore: false, truncated: false }; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details source={{ ...source, kind: "POSTGRES" }} ru={false} onClose={() => {}} onUpdated={() => {}} /></TestDataProvider>); });
  const editor = view!.root.findByProps({ label: "SQL query" });
  await act(async () => editor.props.onChange('SELECT * FROM "customers"'));
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Run")!.props.onPress(); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.deepEqual(calls, [{ sourceIds: ["s"], sql: 'SELECT * FROM "customers"', limit: 50, offset: 0 }]);
  await act(async () => view!.unmount());
});
