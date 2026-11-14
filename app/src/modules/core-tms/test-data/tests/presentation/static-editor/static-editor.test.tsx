import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Editor: typeof import("../../../presentation/static-library/StaticEditor")["StaticEditor"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Editor = require("../../../presentation/static-library/StaticEditor").StaticEditor; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
test("static data saves an exact decimal through the workspace port, without creating a field-map dataset", async () => {
  let saved: unknown = null;
  const value = { projectId: "project", actorId: "qa", permissions: { create: true }, environments: [],
    configuration: { limits: { nameLength: 120, descriptionLength: 2000 } }, workspace: {
      saveStatic: async (draft: unknown) => { saved = draft; return { id: "static", ...draft as object }; },
    } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>, complete = false;
  await act(async () => { view = create(<TestDataProvider value={value}><Editor ru={false} onSaved={() => { complete = true; }} onClose={() => {}} /></TestDataProvider>); });
  const control = (label: string) => view!.root.findAll(node => node.props.label === label || node.props["aria-label"] === label).find(node => typeof node.type === "string")!;
  assert.equal(control("Name").props.label, undefined, "the visible name label is separate from the input value");
  assert.ok(view!.root.findAllByType("label").some(node => node.children.join("") === "Description"));
  await act(async () => { control("Name").props.onValueChange("Minimum payment"); control("Data type").props.onSelectionChange(new Set(["Decimal"])); });
  await act(async () => control("Value").props.onValueChange("999999999999999999.01"));
  await act(async () => view!.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(saved, { name: "Minimum payment", description: "", environmentId: null, dataType: "Decimal", value: "999999999999999999.01" });
  assert.equal(complete, true);
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  await act(async () => view!.unmount());
});
