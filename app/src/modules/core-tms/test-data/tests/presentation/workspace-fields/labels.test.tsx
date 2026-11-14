import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url);
test("workspace field keeps its visible label outside the editable value and connects it accessibly", async () => {
  const restore = installRenderControls(), previous = globalThis.React;
  Object.assign(globalThis, { React });
  try {
    const Field = require("../../../presentation/workspace-fields/WorkspaceTextField").WorkspaceTextField;
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(<Field label="Name" ariaLabel="Dataset name" value="Customers" onValueChange={() => {}} />); });
    const label = view!.root.findByType("label"), input = view!.root.findByType("input");
    assert.equal(label.children.join(""), "Name"); assert.equal(input.props.label, undefined);
    assert.equal(label.props.htmlFor, input.props.id); assert.equal(input.props["aria-label"], "Dataset name");
    await act(async () => view!.unmount());
  } finally { restore(); Object.assign(globalThis, { React: previous }); }
});
