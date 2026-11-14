import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { WorkspaceDataset } from "../../../model/workspace/data-workspace";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Dialog: typeof import("../../../presentation/view-editor/CreateViewDialog")["CreateViewDialog"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Dialog = require("../../../presentation/view-editor/CreateViewDialog").CreateViewDialog; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const dataset = { id: "d", name: "Customers", description: "", revision: 2, status: "ACTIVE", sources: [
  { id: "archived", name: "Old customers", kind: "FILE", status: "ARCHIVED", tableName: "old_customers" },
  { id: "active", name: "Current customers", kind: "FILE", status: "ACTIVE", tableName: "current_customers" },
], views: [] } as unknown as WorkspaceDataset;
test("new views select an active source and save against the authoritative container revision", async () => {
  const calls: unknown[][] = []; let saved = false, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: { saveView: async (...args: unknown[]) => { calls.push(args); return { ...dataset, revision: 3 }; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Dialog dataset={dataset} ru={false} onClose={() => {}} onSaved={() => { saved = true; }} /></TestDataProvider>); });
  assert.deepEqual(Array.from(view!.root.findByProps({ "aria-label": "View sources" }).props.selectedKeys), ["active"]);
  assert.equal(view!.root.findAllByProps({ label: "View SQL" }).length, 0, "file-backed views need only a name and selected sources initially");
  await act(async () => view!.root.findByProps({ "aria-label": "View name" }).props.onValueChange("Active customers"));
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.equal(calls[0][0], dataset);
  assert.deepEqual(calls[0][1], { name: "Active customers", sourceIds: ["active"], query: 'SELECT * FROM "current_customers"' });
  assert.equal(calls[0][2], null); assert.equal(saved, true);
  await act(async () => view!.unmount());
});
test("database views require real SQL rather than a made-up Falcon logical table name", async () => {
  const calls: unknown[][] = [], remote = { ...dataset, sources: [{ ...dataset.sources[1], kind: "POSTGRES" as const }] };
  let view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: { saveView: async (...args: unknown[]) => { calls.push(args); return remote; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Dialog dataset={remote} ru={false} onClose={() => {}} onSaved={() => {}} /></TestDataProvider>); });
  await act(async () => view!.root.findByProps({ "aria-label": "View name" }).props.onValueChange("Customers"));
  await act(async () => view!.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(calls.length, 0);
  const editor = view!.root.findByProps({ label: "View SQL" }); assert.equal(editor.props.value, "");
  await act(async () => editor.props.onChange("SELECT id FROM customers"));
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.deepEqual(calls[0][1], { name: "Customers", sourceIds: ["active"], query: "SELECT id FROM customers" });
  await act(async () => view!.unmount());
});
test("a dataset without sources keeps the view form visible and offers Add source", async () => {
  let additions = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, workspace: {} } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Dialog dataset={{ ...dataset, sources: [] }} ru={false} onClose={() => {}} onSaved={() => {}} onAddSource={() => additions++} /></TestDataProvider>); });
  assert.equal(view!.root.findByProps({ "aria-label": "View name" }).props.value, "");
  const sources = view!.root.findByProps({ "aria-label": "View sources" });
  assert.deepEqual(Array.from(sources.props.selectedKeys), []); assert.equal(sources.props.isDisabled, true);
  assert.equal(view!.root.findAllByType("button").find(button => button.props.type === "submit")!.props.isDisabled, true);
  await act(async () => view!.root.findAllByType("button").find(button => button.children.join("") === "Add source")!.props.onPress());
  assert.equal(additions, 1);
  await act(async () => view!.unmount());
});
