import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createEmptyRevision } from "../../../../../helpers/cases/caseRevision";
import { loadFieldComponent } from "./field-harness";
const Details = loadFieldComponent("../../details/InspectorDetails.tsx", "InspectorDetails");
const Metadata = loadFieldComponent("../../../detail/metadata/CaseMetadataControls.tsx", "CaseMetadataControls");
const byType = (view: ReactTestRenderer, type: string) => view.root.findAll(node => (node.type as unknown) === type);
const revision = { ...createEmptyRevision("en"), testData: "Data", tags: ["smoke"], changeNote: "Original" };
test("tapping tags opens only tags and retains audit authors", () => {
  let edits = 0; let next: any; let view!: ReactTestRenderer;
  const props = { testCaseId: "case", revision, ru: false, editing: false, onPatch: (value: unknown) => { next = value; }, onRequestEdit: () => { edits++; } };
  act(() => { view = create(<Details {...props} />); });
  const tags = byType(view, "field-value").find(node => node.props.label === "Tags");
  assert.ok(tags, "saved tags must be directly editable");
  act(() => { tags.props.onEdit(); view.update(<Details {...props} editing />); });
  assert.equal(edits, 1);
  assert.equal(byType(view, "input").length, 1);
  assert.equal(byType(view, "responsible-picker").length, 0);
  assert.equal(byType(view, "markdown-field").some(node => node.props.onChange), false);
  assert.equal(byType(view, "case-author").length, 1);
  act(() => view.root.findByType("input").props.onChange({ target: { value: "smoke, web" } }));
  assert.deepEqual(JSON.parse(JSON.stringify(next)), { tags: ["smoke", "web"] });
  act(() => view.unmount());
});
test("tapping priority opens only its selector, not every property", () => {
  let edits = 0; let view!: ReactTestRenderer;
  const props = { locale: "en", revision, showLabels: true, editing: false, onChange: () => {}, onRequestEdit: () => { edits++; } };
  act(() => { view = create(<Metadata {...props} />); });
  const priority = byType(view, "field-value").find(node => node.props.label === "Priority");
  assert.ok(priority, "saved priority must be directly editable");
  act(() => { priority.props.onEdit(); view.update(<Metadata {...props} editing />); });
  assert.equal(edits, 1);
  const selects = byType(view, "metadata-select");
  assert.equal(selects.length, 1);
  assert.equal(selects[0].props.label, "Priority");
  assert.equal(selects[0].props.autoOpen, true);
  act(() => view.unmount());
});
test("read-only details expose no field edit action", () => {
  let view!: ReactTestRenderer;
  act(() => { view = create(<Details revision={revision} ru={false} editing={false} onPatch={() => {}} />); });
  assert.equal(byType(view, "field-value").some(node => node.props.onEdit), false);
  act(() => view.unmount());
});

test("a legacy Regression tap resolves the catalog and opens only that field", () => {
  const Fields = loadFieldComponent("../../fields/CaseCustomFields.tsx", "CaseCustomFields", [
    { id: "product", name: "Product", systemKey: "product" },
    { id: "regression", name: "Regression", systemKey: "regression" },
  ]);
  let view!: ReactTestRenderer; let edits = 0;
  const props = { revision: { ...revision, component: "Web" }, editing: false, ru: false, onPatch: () => {}, onRequestEdit: () => { edits++; } };
  act(() => { view = create(<Fields {...props} />); });
  const regression = byType(view, "field-value").find(node => node.props.label === "Regression")!;
  act(() => { regression.props.onEdit(); view.update(<Fields {...props} editing />); });
  assert.equal(edits, 1);
  const pickers = byType(view, "custom-picker");
  assert.equal(pickers.length, 1);
  assert.equal(pickers[0].props.field.id, "regression");
  assert.equal(pickers[0].props.autoOpen, true);
  act(() => view.unmount());
});
