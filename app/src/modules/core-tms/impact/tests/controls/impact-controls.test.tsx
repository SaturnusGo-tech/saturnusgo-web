import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
Object.assign(globalThis, { React });
const loader = require("node:module"), previous = loader._load, previousCss = require.extensions[".css"];
require.extensions[".css"] = (module: NodeModule) => { module.exports = {}; };
loader._load = function(name: string, parent: NodeModule, main: boolean) {
  const kind = ["Input", "Textarea", "Select", "Checkbox", "Switch", "Button", "ControlScope"].find(value => name.endsWith(`/Integration${value}`));
  return kind ? { [`Integration${kind}`]: `control-${kind.toLowerCase()}` } : previous.call(this, name, parent, main);
};
const { MappingEditor } = require("../../presentation/mappings/MappingEditor");
const { ScopeTestRow } = require("../../presentation/scope/ScopeTestRow");
loader._load = previous;
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

test("coverage controls preserve multiline values until submit and update platform IDs", () => {
  const mapping = { id: "m", area: "Payments", platforms: ["web"], pathPrefixes: ["src/a", "src/b"], components: [], tags: [], folderPrefixes: [], endpoints: [] };
  let changed: typeof mapping[] = [];
  const view = create(<MappingEditor mappings={[mapping]} platform="web" ru={false} onChange={(value: typeof mapping[]) => { changed = value; }} />);
  const textareas = view.root.findAllByType("control-textarea" as never);
  assert.equal(textareas.length, 5);
  assert.equal(textareas[0].props.value, "src/a\nsrc/b");
  act(() => textareas[0].props.onValueChange(" src/a \n\nsrc/c"));
  assert.deepEqual(changed[0].pathPrefixes, [" src/a ", "", "src/c"]);
  const platform = view.root.findAllByType("control-checkbox" as never).find(input => input.children.includes("api"))!;
  act(() => platform.props.onValueChange(true));
  assert.deepEqual(changed[0].platforms, ["web", "api"]);
  view.unmount();
});

test("scope checkbox exposes its case identity and blocks commands while pending", () => {
  let toggles = 0;
  const view = create(<ScopeTestRow caseId="c" caseKey="QA-1" title="Checkout" included editable pending ru={false} onToggle={() => { toggles++; }} />);
  const checkbox = view.root.findByType("control-checkbox" as never);
  assert.match(checkbox.props["aria-label"], /QA-1.*Checkout/);
  assert.equal(checkbox.props.isSelected, true);
  assert.equal(checkbox.props.isDisabled, false);
  act(() => checkbox.props.onValueChange(false));
  assert.equal(toggles, 0);
  view.unmount();
});
