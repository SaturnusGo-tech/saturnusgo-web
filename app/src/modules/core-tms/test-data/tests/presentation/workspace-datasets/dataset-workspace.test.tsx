import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { WorkspaceDataset } from "../../../model/workspace/data-workspace";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Pane: typeof import("../../../presentation/dataset-workspace/DatasetWorkspace")["DatasetWorkspace"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Pane = require("../../../presentation/dataset-workspace/DatasetWorkspace").DatasetWorkspace; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
const dataset = { id: "dataset", name: "Customers", description: "Boundary inputs", revision: 2, status: "ACTIVE", sources: [{ id: "source-a", name: "customer_source", kind: "FILE", status: "ACTIVE", rowCount: 100 }], views: [{ id: "active", name: "Active customers", sourceIds: ["source-a"], query: 'SELECT * FROM "customer_source"', revision: 1 }] } as unknown as WorkspaceDataset;
test("dataset workspace opens actual source and view identities without a modal", async () => {
  const open: string[] = [], context = { permissions: { read: true, update: true, create: true }, workspace: {} } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context}><Pane dataset={dataset} ru={false} onClose={() => {}} onUpdated={() => {}} onOpenSource={id => open.push(id)} onOpenView={id => open.push(id)} /></TestDataProvider>); });
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  for (const name of ["customer_source", "Active customers"]) await act(async () => view!.root.findAllByType("button").find(button => text(button).startsWith(name))!.props.onPress());
  assert.deepEqual(open, ["source-a", "active"]);
  await act(async () => view!.unmount());
});
test("empty workspace creates a real named container before source or view operations", async () => {
  const calls: unknown[][] = []; let saved: WorkspaceDataset | null = null, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, create: true }, workspace: { saveDataset: async (...args: unknown[]) => { calls.push(args); return dataset; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Pane dataset={null} ru={false} onClose={() => {}} onUpdated={value => { saved = value; }} onOpenSource={() => {}} onOpenView={() => {}} /></TestDataProvider>); });
  await act(async () => view!.root.findByProps({ "aria-label": "Dataset name" }).props.onValueChange("Customers"));
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await pause(); });
  assert.deepEqual(calls[0][0], { name: "Customers", description: "" }); assert.equal(calls[0][1], null); assert.equal(saved, dataset);
  await act(async () => view!.unmount());
});
test("unsaved dataset actions validate the name instead of silently disabling source and view creation", async () => {
  let creations = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, create: true, update: true }, workspace: { saveDataset: async () => { creations++; return dataset; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Pane dataset={null} ru={false} onClose={() => {}} onUpdated={() => {}} onOpenSource={() => {}} onOpenView={() => {}} /></TestDataProvider>); });
  const source = view!.root.findAllByType("button").find(button => text(button) === "Add source")!;
  const createView = view!.root.findAllByType("button").find(button => text(button) === "Create view")!;
  assert.equal(Boolean(source.props.isDisabled), false); assert.equal(Boolean(createView.props.isDisabled), false);
  await act(async () => { createView.props.onPress(); await pause(); });
  assert.match(text(view!.root.findByProps({ role: "alert" })), /Enter a dataset name/);
  assert.equal(creations, 0); assert.equal(view!.root.findAllByType("dialog").length, 0);
  await act(async () => view!.unmount());
});
test("Create view saves a named new dataset and opens its sources form without a separate Create tap", async () => {
  const calls: unknown[][] = []; let view: ReturnType<typeof create>, updated: WorkspaceDataset | null = null;
  const context = { permissions: { read: true, create: true, update: true }, workspace: { saveDataset: async (...args: unknown[]) => { calls.push(args); return dataset; } } } as unknown as TestDataContextValue;
  const props = { ru: false, onClose() {}, onUpdated(value: WorkspaceDataset) { updated = value; }, onOpenSource() {}, onOpenView() {} };
  await act(async () => { view = create(<TestDataProvider value={context}><Pane dataset={null} {...props} /></TestDataProvider>); });
  await act(async () => view!.root.findByProps({ "aria-label": "Dataset name" }).props.onValueChange("Customers"));
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Create view")!.props.onPress(); await pause(); });
  assert.deepEqual(calls[0][0], { name: "Customers", description: "" }); assert.equal(calls[0][1], null); assert.equal(updated, dataset);
  assert.equal(view!.root.findByProps({ "aria-label": "View name" }).props.value, "");
  assert.deepEqual(Array.from(view!.root.findByProps({ "aria-label": "View sources" }).props.selectedKeys), ["source-a"]);
  await act(async () => view!.update(<TestDataProvider value={context}><Pane dataset={dataset} {...props} /></TestDataProvider>));
  assert.equal(view!.root.findAllByType("dialog").length, 1, "saved selection reconciliation must preserve the open view form");
  await act(async () => view!.unmount());
});
test("Add source saves the new dataset then opens the chosen provider connection", async () => {
  let creations = 0, view: ReturnType<typeof create>; const connections: unknown[][] = [], links: unknown[][] = [], updates: WorkspaceDataset[] = [];
  const container = { ...dataset, sources: [], views: [] }, source = { ...dataset.sources[0], id: "new-source", name: "QA customers", kind: "MYSQL" as const };
  const context = { permissions: { read: true, create: true, update: true, credentialCreate: true }, workspace: {
    saveDataset: async () => { creations++; return container; }, sources: async () => ({ items: [], nextCursor: null }),
    connectSource: async (...args: unknown[]) => { connections.push(args); return source; },
    linkSource: async (...args: unknown[]) => { links.push(args); return { ...container, revision: 3, sources: [source] }; },
  } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Pane dataset={null} ru={false} onClose={() => {}} onUpdated={value => updates.push(value)} onOpenSource={() => {}} onOpenView={() => {}} /></TestDataProvider>); });
  await act(async () => view!.root.findByProps({ "aria-label": "Dataset name" }).props.onValueChange("Customers"));
  await act(async () => { view!.root.findByType("listbox" as never).props.onAction("MYSQL"); await pause(); });
  assert.equal(creations, 1); assert.equal(view!.root.findAllByType("dialog").length, 1);
  assert.equal(view!.root.findByProps({ "aria-label": "Name" }).props.value, "");
  assert.equal(view!.root.findAllByProps({ "aria-label": "Source type" }).length, 0, "the chosen provider must not be requested again");
  assert.equal(view!.root.findByType("dialog").props.title, "MySQL");
  assert.equal(view!.root.findByProps({ "aria-label": "Port" }).props.value, "3306");
  for (const [label, value] of [["Name", "QA customers"], ["Host", "db.example.test"], ["Database", "qa"], ["Username", "reader"], ["Password", "synthetic-fixture-only"]]) {
    await act(async () => view!.root.findByProps({ "aria-label": label }).props.onValueChange(value));
  }
  await act(async () => { const forms = view!.root.findAllByType("form"); forms[forms.length - 1].props.onSubmit({ preventDefault() {} }); await pause(); });
  assert.deepEqual(connections[0][0], { name: "QA customers", description: "", kind: "MYSQL", connection: { host: "db.example.test", port: 3306, database: "qa", username: "reader", password: "synthetic-fixture-only", tls: true } });
  assert.equal(links[0][0], container); assert.equal(links[0][1], "new-source");
  assert.equal(updates[updates.length - 1]?.revision, 3); assert.equal(view!.root.findAllByType("dialog").length, 0);
  assert.ok(view!.root.findAllByType("button").some(button => text(button).startsWith("QA customers")));
  await act(async () => view!.unmount());
});
