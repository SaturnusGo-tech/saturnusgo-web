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
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Details = require("../../../presentation/static-library/StaticDetails").StaticDetails; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
test("saving an existing static resource exits its released editor before another edit can begin", async () => {
  let resource: StaticResource = { id: "static-a", name: "Currency", description: "", environmentId: null, dataType: "String", value: "USD", status: "ACTIVE", revision: 1, currentVersionId: "version-a", createdAt: "now", updatedAt: "now", warnings: [] };
  let view: ReturnType<typeof create>;
  const context = { permissions: { read: true, update: true }, environments: [], workspace: { saveStatic: async (draft: { value: string }) => ({ ...resource, value: draft.value, revision: 2, currentVersionId: "version-b" }) } } as unknown as TestDataContextValue;
  const render = () => <TestDataProvider value={context}><Details key={resource.id} resource={resource} ru={false} onClose={() => {}} onUpdated={value => { resource = value!; view!.update(render()); }} /></TestDataProvider>;
  await act(async () => { view = create(render()); });
  try {
    await act(async () => view!.root.findAllByType("button").find(button => button.children.join("") === "Edit")!.props.onPress());
    await act(async () => view!.root.findAllByType("input").find(input => input.props["aria-label"] === "Value")!.props.onValueChange("EUR"));
    await act(async () => view!.root.findByType("form").props.onSubmit({ preventDefault() {} }));
    assert.equal(view!.root.findAllByType("form").length, 0, "saved editor is unmounted after its leave guard was released");
    assert.equal(view!.root.findByType("pre").children.join(""), "EUR");
  } finally { await act(async () => view!.unmount()); }
});
