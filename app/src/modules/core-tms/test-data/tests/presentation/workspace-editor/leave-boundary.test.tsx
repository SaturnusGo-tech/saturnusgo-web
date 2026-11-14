import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";

const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let CredentialEditor: typeof import("../../../presentation/credential/CredentialEditor")["CredentialEditor"];
let observed: unknown, pendingLeave: (() => void) | undefined;
before(() => {
  Object.assign(globalThis, { React }); const restore = installRenderControls();
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown }, load = loader._load;
  loader._load = function(name, parent, main) {
    if (name.endsWith("/useFormLeave")) return { useFormLeave: (value: unknown) => {
      observed = value; return { close: (action: () => void) => { pendingLeave = action; }, release() {} };
    } };
    return load.call(this, name, parent, main);
  };
  try { CredentialEditor = require("../../../presentation/credential/CredentialEditor").CredentialEditor; }
  finally { restore(); }
});
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const value = { actorId: "qa", projectId: "project", configuration: { enabled: true, credentialsAvailable: true, limits: { datasetFields: 50 } },
  environments: [], permissions: { credentialCreate: true }, port: {} } as unknown as TestDataContextValue;

test("inline credential close and Escape defer to the authoring guard without passing it secret values", async () => {
  let closed = 0, stopped = 0, prevented = 0, view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={value}><CredentialEditor inline ru={false} onSaved={() => {}} onClose={() => { closed++; }} /></TestDataProvider>); });
  await act(async () => { view.root.findAllByType("input").filter(node => node.props.label === "Value")[1].props.onValueChange("test-only-secret"); });
  assert.deepEqual(observed, { name: "", description: "", environmentId: "", edited: 1 });
  view.root.findByProps({ "aria-label": "Close editor" }).props.onPress();
  assert.equal(closed, 0);
  assert.equal(typeof pendingLeave, "function");
  pendingLeave!(); assert.equal(closed, 1); pendingLeave = undefined;
  const frame = view.root.findByProps({ role: "region" });
  assert.equal(typeof frame.props.onKeyDown, "function", "inline editor must keep a keyboard exit");
  frame.props.onKeyDown({ key: "Escape", defaultPrevented: true });
  assert.equal(pendingLeave, undefined, "an open child popup can consume Escape first");
  frame.props.onKeyDown({ key: "Escape", defaultPrevented: false, preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
  assert.equal(closed, 1);
  assert.equal(typeof pendingLeave, "function");
  assert.equal(stopped, 1); assert.equal(prevented, 1);
  await act(async () => view.unmount());
});
