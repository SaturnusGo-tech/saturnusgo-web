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
test("library preserves permission states, switches catalogs and closes details without touching data", async () => {
  let credentialCalls = 0;
  const value = { actorId: "qa", projectId: "project", environments: [], configuration: { enabled: true, credentialsAvailable: true, limits: {} },
    permissions: { read: true, create: false, credentialCreate: false }, port: {
      datasets: async () => ({ items: [dataset], cursor: null }),
      credentials: async () => { credentialCalls++; return { items: [], cursor: null }; },
      version: async () => ({ id: "v1", version: 1, fields: [], createdAt: "2026-11-14T00:00:00Z" }), versions: async () => ({ items: [], cursor: null }), usage: async () => ({ items: [], cursor: null }),
    } } as unknown as TestDataContextValue;
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><TestDataProvider value={value}><Library /></TestDataProvider></TmsLocaleContext.Provider>); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.equal(view!.root.findAllByType("button").some(button => text(button) === "Create dataset"), false);
  assert.equal(view!.root.findAllByType("td").some(cell => text(cell) === "4"), true);
  const entry = view!.root.findAllByType("button").find(button => text(button) === "Payments")!;
  await act(async () => { entry.props.onPress(); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.equal(view!.root.findByType("dialog").props.title, "Payments");
  await act(async () => { view!.root.findByType("dialog").props.onClose(); });
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  await act(async () => { view!.root.findAllByType("button").find(button => button.props.role === "tab" && text(button) === "Credentials")!.props.onPress(); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.equal(credentialCalls, 1); assert.equal(text(view!.root).includes("Your test data will appear here"), true);
  await act(async () => view!.unmount());
});

test("credential library shows the authoritative environment name and protected metadata only", async () => {
  const credential = { id: "admin", name: "QA account", environmentId: "staging", revision: 1, activeSecretVersionId: "secret-v1", usedIn: 2, disabled: false,
    fields: [{ key: "password", type: "String", isSecret: true }], updatedAt: "2026-11-14T00:00:00Z" };
  const value = { actorId: "qa", projectId: "project", environments: [{ id: "staging", name: "Staging EU" }],
    configuration: { enabled: true, credentialsAvailable: false, limits: {} }, permissions: { read: true },
    port: { datasets: async () => ({ items: [], cursor: null }), credentials: async () => ({ items: [credential], cursor: null }) } } as unknown as TestDataContextValue;
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><TestDataProvider value={value}><Library /></TestDataProvider></TmsLocaleContext.Provider>); });
  await act(async () => { view!.root.findAllByType("button").find(button => button.props.role === "tab" && text(button) === "Credentials")!.props.onPress(); await new Promise(resolve => setTimeout(resolve, 10)); });
  assert.ok(view!.root.findAllByType("th").some(cell => text(cell) === "Environment"));
  assert.ok(view!.root.findAllByType("td").some(cell => text(cell) === "Staging EU"));
  assert.equal(text(view!.root).includes("secret-v1"), false);
  await act(async () => view!.unmount());
});
