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
