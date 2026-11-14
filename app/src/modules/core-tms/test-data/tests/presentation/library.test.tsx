import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import { TestDataProvider, type TestDataContextValue } from "../../application/context/TestDataContext";
import { installRenderControls } from "../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Library: typeof import("../../presentation/library/TestDataLibrary")["TestDataLibrary"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Library = require("../../presentation/library/TestDataLibrary").TestDataLibrary; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const dataset = { id: "dataset", name: "Payments", description: "Boundary values", environmentId: null, currentVersionId: "v1", currentVersion: 1, revision: 1, fieldCount: 1, usedIn: 4, archived: false, updatedAt: "2026-11-14T00:00:00Z" };
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
const render = (value: TestDataContextValue) => create(<TmsLocaleContext.Provider value={locale}><TestDataProvider value={value}><Library /></TestDataProvider></TmsLocaleContext.Provider>);
test("resource tree opens the selected dataset in the right pane without a details dialog", async () => {
  const value = { actorId: "qa", projectId: "project", environments: [], configuration: { enabled: true, credentialsAvailable: true, limits: {} },
    permissions: { read: true, create: false, credentialCreate: false }, port: {
      datasets: async () => ({ items: [dataset], cursor: null }), credentials: async () => ({ items: [], cursor: null }),
      version: async () => ({ id: "v1", version: 1, fields: [{ key: "amount", type: "Decimal", value: "0.01" }], createdAt: "2026-11-14T00:00:00Z" }),
      versions: async () => ({ items: [], cursor: null }), usage: async () => ({ items: [], cursor: null }),
    } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = render(value); await pause(); });
  assert.equal(view!.root.findAllByProps({ "aria-label": "Create dataset" }).length, 0);
  const entry = view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Open Payments")!;
  assert.ok(entry, "dataset is a resource-tree entry");
  await act(async () => { entry.props.onPress(); await pause(); });
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  const pane = view!.root.findByProps({ "data-resource-detail": "dataset" });
  assert.ok(text(pane).includes("Payments"));
  assert.ok(text(pane).includes("amount"));
  assert.ok(text(pane).includes("0.01"));
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Close resource")!.props.onPress());
  assert.equal(view!.root.findAllByProps({ "data-resource-detail": "dataset" }).length, 0);
  await act(async () => view!.unmount());
});
test("credential category loads on expansion and displays environment without secret material", async () => {
  let credentialCalls = 0;
  const credential = { id: "admin", name: "QA account", description: "Staging access", environmentId: "staging", revision: 1, activeSecretVersionId: "secret-v1", usedIn: 2, disabled: false,
    fields: [{ key: "password", type: "String", isSecret: true }], updatedAt: "2026-11-14T00:00:00Z" };
  const value = { actorId: "qa", projectId: "project", environments: [{ id: "staging", name: "Staging EU" }],
    configuration: { enabled: true, credentialsAvailable: true, limits: {} }, permissions: { read: true },
    port: { datasets: async () => ({ items: [], cursor: null }), credentials: async () => { credentialCalls++; return { items: [credential], cursor: null }; },
      usage: async () => ({ items: [], cursor: null }) } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = render(value); await pause(); });
  assert.equal(credentialCalls, 0);
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Secure Credentials")!.props.onPress(); await pause(); });
  assert.equal(credentialCalls, 1);
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Open QA account")!.props.onPress(); await pause(); });
  assert.ok(text(view!.root).includes("Staging EU"));
  assert.equal(text(view!.root).includes("secret-v1"), false);
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  await act(async () => view!.unmount());
});
