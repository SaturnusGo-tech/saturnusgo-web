import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { Credential, Dataset } from "../../../model/resources/resource";
import { installRenderControls } from "../../support/render-controls";

const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let DatasetEditor: typeof import("../../../presentation/dataset/DatasetEditor")["DatasetEditor"];
let CredentialEditor: typeof import("../../../presentation/credential/CredentialEditor")["CredentialEditor"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls();
  try {
    DatasetEditor = require("../../../presentation/dataset/DatasetEditor").DatasetEditor;
    CredentialEditor = require("../../../presentation/credential/CredentialEditor").CredentialEditor;
  } finally { restore(); }
});
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const configuration = { enabled: true, credentialsAvailable: true, limits: { nameLength: 120, descriptionLength: 2000, datasetFields: 50 } };
const dataset = { id: "dataset", name: "Customers", description: "", currentVersionId: "v1", currentVersion: 1, revision: 1 } as Dataset;
const credential = { id: "credential", name: "QA account", description: "", environmentId: "staging", fields: [] } as unknown as Credential;
function context(port: object) { return { actorId: "qa", projectId: "project", configuration, environments: [{ id: "staging", name: "Staging" }],
  permissions: { read: true, create: true, update: true, credentialCreate: true, credentialUpdate: true }, port } as unknown as TestDataContextValue; }
function setInput(view: ReturnType<typeof create>, label: string, value: string) {
  view.root.findAllByType("input").find(node => node.props.label === label || node.props["aria-label"] === label)!.props.onValueChange(value);
}

test("a Settings dataset editor stays in its pane and saves through the existing dataset command", async () => {
  let submitted: unknown, saved: Dataset | undefined, closed = 0;
  const value = context({ saveDataset: async (input: unknown) => { submitted = input; return dataset; } });
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><DatasetEditor inline ru={false} onSaved={item => { saved = item; }} onClose={() => { closed++; }} /></TestDataProvider>); });
  assert.equal(view.root.findAllByType("dialog").length, 0, "Settings forms must not mount a modal");
  assert.equal(view.root.findByProps({ role: "region" }).findByType("h2").props.children, "Create dataset");
  assert.equal(view.root.findAllByType("input").find(node => node.props["aria-label"] === "Name")!.props.label, undefined);
  await act(async () => { setInput(view, "Name", "Customers"); setInput(view, "Field name", "email"); });
  await act(async () => { setInput(view, "Value", "qa@example.test"); });
  await act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.deepEqual(submitted, { name: "Customers", description: "", environmentId: null, fields: [{ key: "email", type: "String", value: "qa@example.test" }] });
  assert.equal(saved, dataset);
  await act(async () => { view.root.findByProps({ "aria-label": "Close editor" }).props.onPress(); });
  assert.equal(closed, 1);
  await act(async () => view.unmount());
});

test("existing case dataset forms keep the modal presentation by default", async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context({})}><DatasetEditor ru={false} onSaved={() => {}} onClose={() => {}} /></TestDataProvider>); });
  assert.equal(view.root.findAllByType("dialog").length, 1);
  assert.equal(view.root.findAllByProps({ role: "region" }).length, 0);
  await act(async () => view.unmount());
});

test("dataset version loading and retry remain inside the Settings pane", async () => {
  let fail = true;
  const value = context({ version: async () => { if (fail) throw new Error("offline"); return { id: "v1", version: 1, fields: [{ key: "email", type: "Email", value: "qa@example.test" }] }; } });
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><DatasetEditor inline current={dataset} ru={false} onSaved={() => {}} onClose={() => {}} /></TestDataProvider>); });
  assert.equal(view.root.findAllByType("dialog").length, 0);
  assert.equal(view.root.findAllByProps({ role: "region" }).length, 1);
  fail = false;
  await act(async () => { view.root.findAllByType("button").find(node => node.props.children === "Retry")!.props.onPress(); });
  assert.equal(view.root.findByType("h2").props.children, "New dataset version");
  assert.equal(view.root.findAllByType("input").find(node => node.props.label === "Value")!.props.value, "qa@example.test");
  await act(async () => view.unmount());
});

test("inline credential fields use the protected command and clear their local secret after saving", async () => {
  let submitted: unknown, saved: Credential | undefined;
  const value = context({ saveCredential: async (input: unknown) => { submitted = input; return credential; } });
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><CredentialEditor inline ru={false} onSaved={item => { saved = item; }} onClose={() => {}} /></TestDataProvider>); });
  assert.equal(view.root.findAllByType("dialog").length, 0);
  await act(async () => { setInput(view, "Name", "QA account"); view.root.findAllByType("input").filter(node => node.props.label === "Value")[0].props.onValueChange("qa@example.test"); });
  await act(async () => { view.root.findByType("textarea").props.onValueChange("Staging access\nFor release validation"); });
  await act(async () => { view.root.findAllByType("input").filter(node => node.props.label === "Value")[1].props.onValueChange("test-only-password");
    view.root.findAllByType("select").find(node => node.props.label === "Environment")!.props.onSelectionChange(new Set(["staging"])); });
  await act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.deepEqual(submitted, { name: "QA account", description: "Staging access\nFor release validation", environmentId: "staging", fields: [
    { key: "email", type: "Email", value: "qa@example.test", isSecret: false }, { key: "password", type: "String", value: "test-only-password", isSecret: true },
  ] });
  assert.equal(saved, credential);
  assert.equal(view.root.findAllByType("input").some(node => node.props.value === "test-only-password"), false);
  await act(async () => view.unmount());
});
