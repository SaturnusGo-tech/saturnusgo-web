import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../application/context/TestDataContext";
import type { TestDataBinding } from "../../model/bindings/binding";
import { installRenderControls } from "../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let StaticEditor: typeof import("../../presentation/static/StaticDataEditor")["StaticDataEditor"];
let SourceSelector: typeof import("../../presentation/selector/SourceSelector")["SourceSelector"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try {
  StaticEditor = require("../../presentation/static/StaticDataEditor").StaticDataEditor;
  SourceSelector = require("../../presentation/selector/SourceSelector").SourceSelector;
} finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const configuration = { enabled: true, credentialsAvailable: true, limits: { datasetFields: 50 } };
test("inline static editor asks the server to validate exact decimal text before accepting a binding", async () => {
  let valid = false, saved: TestDataBinding | undefined, inspected: readonly TestDataBinding[] = [];
  const value = { actorId: "qa", projectId: "project", configuration, permissions: { read: true, bind: true }, port: {
    validate: async (bindings: readonly TestDataBinding[]) => { inspected = bindings; return { valid, errors: valid ? [] : [{ code: "TEST_DATA_INVALID", alias: "amount" }], variables: [], warnings: [], referencedResources: [] }; },
  } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><StaticEditor ru={false} onSave={binding => { saved = binding; }} onClose={() => {}} /></TestDataProvider>); });
  const set = (label: string, text: string) => view!.root.findAllByType("input").find(input => input.props.label === label)!.props.onValueChange(text);
  await act(async () => { set("Name", "Payment amount"); set("Alias", "amount"); view!.root.findByType("select").props.onSelectionChange(new Set(["Decimal"])); set("Value", "9007199254740993.01"); });
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.equal(saved, undefined); assert.equal(view!.root.findAllByProps({ role: "alert" }).length > 0, true);
  assert.equal(inspected[0].sourceType === "STATIC" && inspected[0].staticDefinition.value, "9007199254740993.01");
  valid = true;
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  const result = saved as TestDataBinding | undefined;
  assert.equal(result?.alias, "amount"); assert.equal(result?.sourceType === "STATIC" && result.staticDefinition.value, "9007199254740993.01");
  await act(async () => view!.unmount());
});
test("reopening a dataset binding retains its pinned historical version until an explicit update", async () => {
  const dataset = { id: "d", name: "Boundary", description: "", environmentId: null, currentVersionId: "v2", currentVersion: 2, revision: 2, fieldCount: 1, usedIn: 1, updatedAt: "2026-11-14", archived: false };
  const version = (id: string) => ({ id, version: id === "v1" ? 1 : 2, fields: [{ key: "amount", type: "Decimal", value: "0.01" }], createdAt: "2026-11-14" });
  const initial = { id: "binding", alias: "payment", required: true, sourceType: "DATASET", sourceId: "d", sourceVersionId: "v1" } as const;
  let saved: TestDataBinding | undefined;
  const value = { actorId: "qa", projectId: "project", configuration, permissions: { read: true, bind: true }, port: {
    datasets: async () => ({ items: [dataset], cursor: null }), dataset: async () => dataset,
    versions: async () => ({ items: [version("v2")], cursor: null }), version: async (_id: string, id: string) => version(id),
  } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><SourceSelector initial={initial} kind="DATASET" ru={false} onSave={binding => { saved = binding; }} onClose={() => {}} /></TestDataProvider>); await new Promise(resolve => setTimeout(resolve, 10)); });
  const picker = () => view!.root.findAllByType("select").find(node => node.props.label === "Pinned version")!;
  assert.deepEqual(picker().props.selectedKeys, ["v1"]);
  assert.equal(picker().findAllByType("option").some(option => option.props.children.includes("Version 1")), true);
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.deepEqual(saved, initial);
  await act(async () => { picker().props.onSelectionChange(new Set(["v2"])); });
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.equal(saved?.sourceType === "DATASET" && saved.sourceVersionId, "v2");
  await act(async () => view!.unmount());
});
test("a pending static validation locks all draft controls until its captured value is accepted", async () => {
  let reply!: (value: { valid: boolean; errors: never[]; warnings: never[]; variables: never[]; referencedResources: never[] }) => void;
  const value = { actorId: "qa", projectId: "p", configuration, permissions: { bind: true }, port: {
    validate: () => new Promise(resolve => { reply = resolve; }),
  } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><StaticEditor ru={false} onSave={() => {}} onClose={() => {}} /></TestDataProvider>); });
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.equal(view!.root.findAllByType("input").every(input => input.props.isDisabled), true);
  assert.equal(view!.root.findByType("select").props.isDisabled, true);
  await act(async () => { reply({ valid: true, errors: [], warnings: [], variables: [], referencedResources: [] }); });
  await act(async () => view!.unmount());
});
test("TDM dialogs isolate form submission and own Escape from their parent case editor", async () => {
  let closed = 0;
  const DataModal = require("../../presentation/shared/DataModal").DataModal;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<DataModal title="Data" onClose={() => { closed++; }}><form /></DataModal>); });
  const boundary = view!.root.findAllByType("div").find(node => typeof node.props.onSubmit === "function")!;
  let stopped = 0, prevented = 0;
  boundary.props.onSubmit({ stopPropagation() { stopped++; } });
  boundary.props.onKeyDown({ key: "Escape", defaultPrevented: true });
  assert.equal(closed, 0);
  boundary.props.onKeyDown({ key: "Escape", defaultPrevented: false, stopPropagation() { stopped++; }, preventDefault() { prevented++; } });
  assert.equal(closed, 1); assert.equal(stopped, 2); assert.equal(prevented, 1);
  await act(async () => view!.unmount());
});
