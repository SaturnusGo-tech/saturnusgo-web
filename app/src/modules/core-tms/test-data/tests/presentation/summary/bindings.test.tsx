import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { CaseDataProvider } from "../../../application/editor/CaseDataContext";
import { installRenderControls } from "../../support/render-controls";
import type { TestDataBinding } from "../../../model/bindings/binding";
const require = createRequire(import.meta.url);
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join(" ");
test("binding rows show the pinned version and authoritative credential environment and lifecycle", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const previous = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const restore = installRenderControls();
  let Section: typeof import("../../../presentation/bindings/TestDataSection")["TestDataSection"];
  try { Section = require("../../../presentation/bindings/TestDataSection").TestDataSection; } finally { restore(); }
  const bindings: readonly TestDataBinding[] = [
    { id: "dataset-bind", alias: "payment", required: true, sourceType: "DATASET", sourceId: "dataset-a", sourceVersionId: "v7" },
    { id: "credential-bind", alias: "admin", required: true, sourceType: "CREDENTIAL", sourceId: "credential-a" },
  ];
  const feature = { actorId: "qa", projectId: "project", environments: [{ id: "staging", name: "Staging EU" }], configuration: { limits: { bindings: 50 } },
    permissions: { read: true, bind: true }, port: { validate: async () => ({ valid: true, errors: [], warnings: [], variables: [], referencedResources: [
      { alias: "payment", id: "dataset-a", name: "Payments", sourceType: "DATASET", versionId: "v7", currentVersionId: "v8", version: 7, environmentId: null, status: "ACTIVE" },
      { alias: "admin", id: "credential-a", name: "QA Admin", sourceType: "CREDENTIAL", environmentId: "staging", status: "active" },
    ] }) } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  try {
    await act(async () => { view = create(<TestDataProvider value={feature}><CaseDataProvider bindings={bindings} steps={[]} editable={false}><Section ru={false} /></CaseDataProvider></TestDataProvider>); });
    await act(async () => { context.mock.timers.tick(200); });
    const content = text(view!.root);
    assert.ok(content.includes("v7")); assert.ok(content.includes("Staging EU")); assert.ok(content.includes("Configured"));
    assert.equal(content.includes("Ready"), false, "active metadata does not assert external account health");
  } finally {
    await act(async () => view!.unmount());
    if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React");
  }
});
test("execution data describes sources in the selected language and never displays a protected value", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const restore = installRenderControls();
  let Panel: typeof import("../../../presentation/execution/ExecutionDataPanel")["ExecutionDataPanel"];
  try { Panel = require("../../../presentation/execution/ExecutionDataPanel").ExecutionDataPanel; } finally { restore(); }
  const versionId = "7b79ba41-1fb3-4fba-8046-64f735e5fb6e", preparedAt = "2026-11-14T09:00:00.000Z";
  const feature = { permissions: { reveal: false }, port: { manifest: async () => ({ executionId: "execution", environmentId: "staging", preparedAt, sources: [
    { alias: "payment", sourceType: "DATASET", name: "Payments", versionId, fields: [{ key: "amount", type: "Decimal", isSecret: false, value: "0.0100" }] },
    { alias: "admin", sourceType: "CREDENTIAL", name: "Admin", fields: [{ key: "password", type: "String", isSecret: true, value: "must-not-display" }] },
  ] }) } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  try {
    await act(async () => { view = create(<TestDataProvider value={feature}><Panel scope={{ runId: "run", itemId: "item", attemptNo: 1 }} refreshVersion="1" configured ru /></TestDataProvider>); });
    const content = text(view!.root);
    assert.ok(content.includes("Набор данных")); assert.ok(content.includes("Учётные данные")); assert.ok(content.includes("Защищено"));
    assert.ok(content.includes("0.0100")); assert.equal(content.includes("must-not-display"), false); assert.equal(content.includes("DATASET"), false);
    assert.equal(view!.root.findByType("time").props.dateTime, preparedAt);
    const version = view!.root.findAllByProps({ title: versionId });
    assert.equal(version.length, 1); assert.ok(text(version[0]).length < versionId.length, "the full immutable version is available without spreading a UUID across the row");
  } finally {
    await act(async () => view!.unmount());
    if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React");
  }
});
