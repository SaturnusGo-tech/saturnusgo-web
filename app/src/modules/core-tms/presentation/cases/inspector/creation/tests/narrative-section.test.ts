import assert from "node:assert/strict";
import test from "node:test";
import type { CreationNarrativeSection } from "../CreationNarrativeSection";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";

test("shared creation narratives retain snapshots, save behavior and opt-in keyboard editing", () => {
  const h = componentHarness(); let value = "Original description";
  const { CreationNarrativeSection: View } = h.load<{ CreationNarrativeSection: typeof CreationNarrativeSection }>(new URL("../CreationNarrativeSection.tsx", import.meta.url));
  const render = (extra = {}) => h.render(() => View({ section: "description", title: "Description", value, ru: false, onChange(next) { value = next; }, ...extra }));
  let all = nodes(render());
  assert.equal(all.find(node => node.type === "InspectorSectionView")?.props.hideEdit, false);
  assert.equal(all.find(node => node.type === "MarkdownField")?.props.editOnKeyboard, false);
  invoke(all.find(node => node.type === "MarkdownField")!, "onRequestEdit");
  all = nodes(render());
  invoke(all.find(node => node.type === "MarkdownField")!, "onChange", "Changed description");
  invoke(all.find(node => node.type === "InspectorSectionView")!, "onCancel");
  assert.equal(value, "Original description");
  all = nodes(render({ hideEdit: true }));
  assert.equal(all.find(node => node.type === "InspectorSectionView")?.props.hideEdit, true);
  assert.equal(all.find(node => node.type === "MarkdownField")?.props.editOnKeyboard, true);
  invoke(all.find(node => node.type === "MarkdownField")!, "onRequestEdit");
  all = nodes(render({ hideEdit: true }));
  invoke(all.find(node => node.type === "MarkdownField")!, "onChange", "Saved description");
  invoke(all.find(node => node.type === "InspectorSectionView")!, "onSave");
  assert.equal(value, "Saved description");
  assert.equal(nodes(render()).find(node => node.type === "MarkdownField")?.props.onChange, undefined);
});

test("disabled creation narratives cannot enter editing and expose field errors", () => {
  const h = componentHarness();
  const { CreationNarrativeSection: View } = h.load<{ CreationNarrativeSection: typeof CreationNarrativeSection }>(new URL("../CreationNarrativeSection.tsx", import.meta.url));
  const all = nodes(h.render(() => View({ section: "description", title: "Description", value: "", ru: false, onChange() {}, disabled: true, hideEdit: true, error: "Add a description" })));
  assert.equal(all.find(node => node.type === "MarkdownField")?.props.onRequestEdit, undefined);
  assert.equal(all.find(node => node.type === "MarkdownField")?.props.onChange, undefined);
  assert.equal(all.find(node => node.type === "InspectorSectionView")?.props.disabled, true);
  assert.equal(all.find(node => node.props.role === "alert")?.props.children, "Add a description");
});
