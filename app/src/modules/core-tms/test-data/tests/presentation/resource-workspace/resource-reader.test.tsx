import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { Dataset, Credential } from "../../../model/resources/resource";
import { installRenderControls } from "../../support/render-controls";

const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Details: typeof import("../../../presentation/resource/ResourceDetails")["ResourceDetails"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Details = require("../../../presentation/resource/ResourceDetails").ResourceDetails; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
const dataset: Dataset = { id: "payments", name: "Payments", description: "Boundary values", environmentId: null, revision: 2,
  currentVersionId: "v2", currentVersion: 2, fieldCount: 1, usedIn: 0, updatedAt: "2026-11-14T00:00:00Z", archived: false };
const credential: Credential = { id: "admin", name: "QA account", description: "", environmentId: "staging", revision: 1,
  activeSecretVersionId: "secret-version-private", fields: [{ key: "password", type: "String", isSecret: true, value: "must-never-render" }],
  disabled: false, usedIn: 0, updatedAt: "2026-11-14T00:00:00Z" };
function context(overrides: object = {}): TestDataContextValue {
  return { actorId: "qa", projectId: "project", environments: [{ id: "staging", name: "Staging EU" }], permissions: { read: true, archive: true },
    configuration: { enabled: true, revealVerificationAvailable: true }, port: { usage: async () => ({ items: [], cursor: null }),
      versions: async () => ({ items: [{ id: "v1", version: 1, environmentId: null, fields: [], createdAt: "" }], cursor: null }),
      version: async (_id: string, versionId: string) => ({ id: versionId, version: versionId === "v1" ? 1 : 2, environmentId: null,
        fields: [{ key: "amount", type: "Decimal", value: versionId === "v1" ? "0.01" : "0.02" }], createdAt: "" }), ...overrides },
  } as unknown as TestDataContextValue;
}
test("inline reader shows immutable dataset fields immediately and switches versions without a dialog", async () => {
  let closed = 0, view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context()}><Details resource={dataset} inline ru={false} onClose={() => closed++} onUpdated={() => {}} /></TestDataProvider>); await pause(); });
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  const pane = view!.root.findByProps({ "data-resource-detail": "payments" });
  assert.ok(text(pane).includes("0.02"));
  assert.equal(pane.findAllByType("table").length, 1);
  await act(async () => { pane.findByType("select").props.onSelectionChange(new Set(["v1"])); await pause(); });
  assert.ok(text(pane).includes("0.01"));
  assert.equal(text(pane).includes("0.02"), false);
  await act(async () => pane.findAllByType("button").find(button => button.props["aria-label"] === "Close resource")!.props.onPress());
  assert.equal(closed, 1);
  await act(async () => view!.unmount());
});
test("inline credentials show the environment and mask protected values without exposing internal version IDs", async () => {
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context()}><Details resource={credential} inline ru={false} onClose={() => {}} onUpdated={() => {}} /></TestDataProvider>); await pause(); });
  const content = text(view!.root);
  assert.ok(content.includes("Staging EU"));
  assert.ok(content.includes("Protected"));
  assert.equal(content.includes("must-never-render"), false);
  assert.equal(content.includes("secret-version-private"), false);
  assert.equal(view!.root.findAllByType("button").some(button => text(button) === "Reveal"), false);
  await act(async () => view!.unmount());
});
test("inline archive remains an explicit confirmed command using the resource revision", async () => {
  const calls: unknown[][] = []; let updated = 0, view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context({ archiveDataset: async (...args: unknown[]) => { calls.push(args); } })}><Details resource={dataset} inline ru={false} onClose={() => {}} onUpdated={() => updated++} /></TestDataProvider>); await pause(); });
  await act(async () => view!.root.findAllByType("button").find(button => text(button) === "Archive")!.props.onPress());
  assert.equal(calls.length, 0);
  assert.ok(text(view!.root).includes("Existing bindings and history are preserved"));
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Confirm")!.props.onPress(); await pause(); });
  assert.equal(calls.length, 1); assert.equal(calls[0][0], dataset); assert.equal(calls[0][1], false); assert.equal(updated, 1);
  await act(async () => view!.unmount());
});
