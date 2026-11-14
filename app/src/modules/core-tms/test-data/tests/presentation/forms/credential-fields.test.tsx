import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React, { useState } from "react";
import { act, create } from "react-test-renderer";
import { installRenderControls } from "../../support/render-controls";
import type { EditableField } from "../../../presentation/forms/ResourceFields";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Fields: typeof import("../../../presentation/forms/ResourceFields")["ResourceFields"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls();
  try { Fields = require("../../../presentation/forms/ResourceFields").ResourceFields; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });

test("protecting an email credential preserves its text but offers only the supported secret String type", async () => {
  let changed: readonly EditableField[] = [];
  function Form() {
    const [fields, setFields] = useState<readonly EditableField[]>([{ localId: "email", key: "login", type: "Email", text: "qa@example.test", isSecret: false }]);
    return <Fields fields={fields} onChange={next => { changed = next; setFields(next); }} credentials ru={false} />;
  }
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Form />); });
  await act(async () => { view!.root.findByType("switch").props.onValueChange(true); });
  assert.equal(changed[0].isSecret, true);
  assert.equal(changed[0].type, "String");
  assert.equal(changed[0].text, "qa@example.test");
  assert.deepEqual(view!.root.findByType("select").findAllByType("option").map(option => option.props.children), ["String"]);
  await act(async () => { view!.root.findByType("switch").props.onValueChange(false); });
  assert.deepEqual(view!.root.findByType("select").findAllByType("option").map(option => option.props.children), ["String", "Email"]);
  await act(async () => view!.unmount());
});

test("credential rows have individually named controls and keep protected values in password inputs", async () => {
  const fields: readonly EditableField[] = [
    { localId: "email", key: "email", type: "Email", text: "qa@example.test", isSecret: false },
    { localId: "password", key: "password", type: "String", text: "local-secret", isSecret: true },
  ];
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Fields fields={fields} onChange={() => {}} credentials ru={false} />); });
  const values = view!.root.findAllByType("input").filter(node => node.props.label === "Value");
  assert.deepEqual(values.map(node => node.props["aria-label"]), ["Field value 1", "Field value 2"]);
  assert.deepEqual(values.map(node => node.props.type), ["text", "password"]);
  assert.equal(values[1].props.autoComplete, "off");
  assert.deepEqual(view!.root.findAllByType("switch").map(node => node.props["aria-label"]), ["Protect field 1", "Protect field 2"]);
  assert.equal(view!.root.findAllByType("button").find(node => node.props["aria-label"] === "Remove field 1")!.props.isDisabled, false);
  await act(async () => view!.unmount());
});
