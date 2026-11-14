import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { WorkspaceDataset } from "../../../model/workspace/data-workspace";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Picker: typeof import("../../../presentation/workspace-source-picker/SourceLinkDialog")["SourceLinkDialog"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Picker = require("../../../presentation/workspace-source-picker/SourceLinkDialog").SourceLinkDialog; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
class RenderBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>Catalog restarted continuously</p> : this.props.children; }
}
test("existing sources finish loading and stay available through an unrelated dialog render", async () => {
  let reads = 0, commits = 0, view: ReturnType<typeof create>;
  const source = { id: "source-a", name: "Customer boundary source", description: "", kind: "FILE", status: "ACTIVE", revision: 1, tableName: "customers", columns: [], rowCount: 2, createdAt: "now", updatedAt: "now" };
  const context = { permissions: { read: true, update: true }, workspace: { sources: async () => { reads++; return { items: [source], cursor: null }; } } } as unknown as TestDataContextValue;
  const dataset = { id: "dataset-a", name: "Customers", revision: 1, status: "ACTIVE", sources: [], views: [] } as unknown as WorkspaceDataset;
  const render = (ru: boolean) => <TestDataProvider value={context}><RenderBoundary><React.Profiler id="source-picker" onRender={() => { if (++commits > 8) throw new Error("Unbounded catalog restart"); }}><Picker dataset={dataset} ru={ru} onClose={() => {}} onLinked={() => {}} /></React.Profiler></RenderBoundary></TestDataProvider>;
  await act(async () => { view = create(render(false)); await new Promise(resolve => setTimeout(resolve, 20)); });
  try {
    assert.match(text(view!.root), /Customer boundary source/);
    await act(async () => { view!.update(render(true)); await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.match(text(view!.root), /Customer boundary source/);
    assert.equal(reads, 1);
  } finally { await act(async () => view!.unmount()); }
});
