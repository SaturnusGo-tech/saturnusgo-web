import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Editor: typeof import("../../../presentation/source-editor/SourceEditor")["SourceEditor"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Editor = require("../../../presentation/source-editor/SourceEditor").SourceEditor; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
test("Postman source connects through scoped write-only API key fields and clears the submitted secret", async () => {
  const calls: unknown[] = []; let saved = 0, view: ReturnType<typeof create>;
  const context = { permissions: { create: true, credentialCreate: true }, workspace: { connectSource: async (value: unknown) => { calls.push(value); return { id: "source" }; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Editor inline ru={false} onClose={() => {}} onSaved={() => saved++} /></TestDataProvider>); });
  await act(async () => view!.root.findAllByType("select").find(select => select.props["aria-label"] === "Source type")!.props.onSelectionChange(new Set(["POSTMAN"])));
  for (const [label, value] of [["Name", "Customers"], ["Dataset ID", "d3c3bcce-8eab-4fa5-8ac2-5e267a53dc0a"], ["API key", "secret-local-only"]]) {
    await act(async () => view!.root.findAllByType("input").find(input => input.props["aria-label"] === label)!.props.onValueChange(value));
  }
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await pause(); });
  assert.deepEqual(calls, [{ name: "Customers", description: "", kind: "POSTMAN", connection: { datasetId: "d3c3bcce-8eab-4fa5-8ac2-5e267a53dc0a", region: "us", apiKey: "secret-local-only" } }]);
  assert.equal(saved, 1); assert.equal(view!.root.findAllByType("input").find(input => input.props["aria-label"] === "API key")!.props.value, "");
  assert.equal(text(view!.root).includes("secret-local-only"), false);
  await act(async () => view!.unmount());
});
test("workbook source imports the explicitly selected worksheet through the scoped source command", async () => {
  const calls: unknown[] = []; let view: ReturnType<typeof create>;
  const context = { permissions: { create: true }, workspace: { readImportFile: async () => ({ name: "seed.xlsx", format: "CSV", sheets: [{ name: "Customers", content: "name\nAvery" }, { name: "Boundary values", content: "amount\n0.01" }] }), importSource: async (value: unknown) => { calls.push(value); return { id: "source" }; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Editor inline ru={false} onClose={() => {}} onSaved={() => {}} /></TestDataProvider>); });
  await act(async () => { view!.root.findAllByType("input").find(input => input.props.type === "file")!.props.onChange({ currentTarget: { files: [{ name: "seed.xlsx" }], value: "seed.xlsx" } }); await pause(); });
  await act(async () => view!.root.findAllByType("select").find(select => select.props["aria-label"] === "Worksheet")!.props.onSelectionChange(new Set(["1"])));
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await pause(); });
  assert.deepEqual(calls, [{ name: "seed", description: "", format: "CSV", content: "amount\n0.01", provenance: "FILE" }]);
  await act(async () => view!.unmount());
});
test("file authors cannot submit credential-backed source connections", async () => {
  let connected = 0, view: ReturnType<typeof create>;
  const context = { permissions: { create: true, credentialCreate: false }, workspace: { connectSource: async () => { connected++; } } } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Editor inline ru={false} onClose={() => {}} onSaved={() => {}} /></TestDataProvider>); });
  const type = view!.root.findAllByType("select").find(select => select.props["aria-label"] === "Source type")!;
  assert.deepEqual(Array.from(type.props.disabledKeys), ["POSTMAN", "POSTGRES", "MYSQL"]);
  await act(async () => type.props.onSelectionChange(new Set(["POSTMAN"])));
  for (const [label, value] of [["Name", "Customers"], ["Dataset ID", "d3c3bcce-8eab-4fa5-8ac2-5e267a53dc0a"], ["API key", "local-only"]]) await act(async () => view!.root.findAllByType("input").find(input => input.props["aria-label"] === label)!.props.onValueChange(value));
  await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); await pause(); });
  assert.equal(connected, 0); await act(async () => view!.unmount());
});
test("choosing MySQL opens its actual connection form with the correct default port", async () => {
  let view: ReturnType<typeof create>;
  const context = { permissions: { create: true, credentialCreate: true }, workspace: {} } as unknown as TestDataContextValue;
  await act(async () => { view = create(<TestDataProvider value={context}><Editor inline initialKind="MYSQL" ru={false} onClose={() => {}} onSaved={() => {}} /></TestDataProvider>); });
  assert.deepEqual(view!.root.findAllByType("select").find(select => select.props["aria-label"] === "Source type")!.props.selectedKeys, ["MYSQL"]);
  assert.equal(view!.root.findAllByType("input").find(input => input.props["aria-label"] === "Port")!.props.value, "3306");
  assert.equal(view!.root.findAllByType("input").some(input => input.props.type === "file"), false);
  await act(async () => view!.unmount());
});
