import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { StaticResource } from "../../../model/catalog/static-resource";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Details: typeof import("../../../presentation/static-library/StaticDetails")["StaticDetails"];
before(() => {
  Object.assign(globalThis, { React }); const restore = installRenderControls();
  const loader = require("node:module"), load = loader._load;
  loader._load = (name: string, ...args: unknown[]) => name.endsWith("/FalconTooltip") ? { FalconTooltip: ({ children }: React.PropsWithChildren) => children } : load(name, ...args);
  try { Details = require("../../../presentation/static-library/StaticDetails").StaticDetails; } finally { loader._load = load; restore(); }
});
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
test("saving an existing static resource exits its released editor before another edit can begin", async () => {
  let resource: StaticResource = { id: "static-a", name: "Currency", description: "", environmentId: null, dataType: "String", value: "USD", status: "ACTIVE", revision: 1, currentVersionId: "version-a", createdAt: "now", updatedAt: "now", warnings: [] };
  let view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, environments: [], workspace: { saveStatic: async (draft: { value: string }) => ({ ...resource, value: draft.value, revision: 2, currentVersionId: "version-b" }) } } as unknown as TestDataContextValue;
  const render = () => <TestDataProvider value={context}><Details key={resource.id} resource={resource} ru={false} onClose={() => {}} onUpdated={value => { resource = value!; view!.update(render()); }} /></TestDataProvider>;
  await act(async () => { view = create(render()); });
  try {
    await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Edit static data")!.props.onPress());
    await act(async () => view!.root.findAllByType("input").find(input => input.props["aria-label"] === "Value")!.props.onValueChange("EUR"));
    await act(async () => view!.root.findByType("form").props.onSubmit({ preventDefault() {} }));
    assert.equal(view!.root.findAllByType("form").length, 0, "saved editor is unmounted after its leave guard was released");
    assert.equal(view!.root.findByType("output").children.join(""), "EUR");
  } finally { await act(async () => view!.unmount()); }
});
test("static details expose compact header actions and require confirmation before archiving", async () => {
  const resource: StaticResource = { id: "amount", name: "Minimum payment amount", description: "Lower boundary", environmentId: "staging", dataType: "Decimal", value: "9007199254740993.01", status: "ACTIVE", revision: 1, currentVersionId: "v1", createdAt: "now", updatedAt: "now", warnings: [] };
  const archives: unknown[][] = []; let updates = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true, archive: true }, environments: [{ id: "staging", name: "Staging" }], workspace: { archiveStatic: async (...args: unknown[]) => { archives.push(args); } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details resource={resource} ru={false} onClose={() => {}} onUpdated={() => { updates++; }} /></TestDataProvider>); });
  try {
    const header = view!.root.findByType("header"), buttons = header.findAllByType("button");
    assert.deepEqual(buttons.map(button => button.props["aria-label"]), ["Edit static data", "Archive resource", "Close resource"]);
    assert.ok(buttons.every(button => button.props.isIconOnly));
    assert.equal(view!.root.findByType("output").children.join(""), resource.value, "decimal precision survives read-only presentation");
    assert.equal(view!.root.findAllByType("pre").length, 0, "scalar values use regular text rather than a code block");
    assert.equal(view!.root.findAllByType("dt").find(label => label.children.join("") === "Decimal value")?.children.join(""), "Decimal value");
    await act(async () => buttons[1].props.onPress());
    assert.equal(archives.length, 0);
    assert.equal(view!.root.findAllByType("dialog").length, 1);
    await act(async () => view!.root.findAllByType("button").find(button => button.children.join("") === "Archive")!.props.onPress());
    assert.equal(archives.length, 1); assert.equal(archives[0][0], resource); assert.equal(archives[0][1], false); assert.equal(updates, 1);
  } finally { await act(async () => view!.unmount()); }
});
test("read-only static data keeps empty and boolean values explicit without editing actions", async () => {
  const resource: StaticResource = { id: "text", name: "Empty input", description: "", environmentId: null, dataType: "String", value: "", status: "ACTIVE", revision: 1, currentVersionId: "v1", createdAt: "now", updatedAt: "now", warnings: [] };
  const context = { permissions: { read: true }, environments: [] } as unknown as TestDataContextValue;
  let closes = 0, view: ReturnType<typeof create>;
  const render = (current: StaticResource) => <TestDataProvider value={context}><Details resource={current} ru={false} onClose={() => { closes++; }} onUpdated={() => {}} /></TestDataProvider>;
  await act(async () => { view = create(render(resource)); });
  try {
    assert.equal(view!.root.findByType("output").children.join(""), "Empty string");
    assert.equal(view!.root.findAllByType("button").length, 1);
    await act(async () => view!.update(render({ ...resource, dataType: "Boolean", value: false })));
    assert.equal(view!.root.findByType("output").children.join(""), "false");
    const json = '{"amount":9007199254740993.01}';
    await act(async () => view!.update(render({ ...resource, dataType: "JSON", value: json })));
    assert.equal(view!.root.findByType("pre").children.join(""), json, "JSON presentation preserves the stored representation");
    await act(async () => view!.root.findByType("button").props.onPress()); assert.equal(closes, 1);
  } finally { await act(async () => view!.unmount()); }
});
test("restoring static data keeps confirmation open on failure and retries the same command", async () => {
  const resource: StaticResource = { id: "archived", name: "Currency", description: "", environmentId: null, dataType: "String", value: "USD", status: "ARCHIVED", revision: 2, currentVersionId: "v1", createdAt: "now", updatedAt: "now", warnings: [] };
  const calls: unknown[][] = []; let updates = 0, view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true, archive: true }, environments: [], workspace: { archiveStatic: async (...args: unknown[]) => {
    calls.push(args); if (calls.length === 1) throw { code: "REQUEST_FAILED" };
  } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Details resource={resource} ru={false} onClose={() => {}} onUpdated={() => { updates++; }} /></TestDataProvider>); });
  try {
    assert.equal(view!.root.findAllByType("button").some(button => button.props["aria-label"] === "Edit static data"), false);
    await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Restore resource")!.props.onPress());
    const restore = () => view!.root.findAllByType("button").find(button => button.children.join("") === "Restore")!.props.onPress();
    await act(async () => restore());
    assert.equal(updates, 0); assert.equal(view!.root.findAllByType("dialog").length, 1);
    assert.equal(view!.root.findAllByProps({ role: "alert" }).length, 1);
    await act(async () => restore());
    assert.equal(calls[0][1], true); assert.equal(calls[0][2], calls[1][2]);
    assert.equal(updates, 1); assert.equal(view!.root.findAllByType("dialog").length, 0);
  } finally { await act(async () => view!.unmount()); }
});
