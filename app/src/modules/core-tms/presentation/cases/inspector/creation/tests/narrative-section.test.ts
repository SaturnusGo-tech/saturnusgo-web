import assert from "node:assert/strict";
import test from "node:test";
import type { CreationNarrativeSection } from "../CreationNarrativeSection";
import type { TestCaseRevision } from "../../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { restoreInspectorSection } from "../../model";

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

test("cancelling test data restores only that narrative and preserves other edits", () => {
  const original: TestCaseRevision = {
    revision: 1, title: "Checkout", description: "Original description", preconditions: "Signed in",
    type: "manual", lifecycle: "ready", priority: "high", component: "Checkout", ownerIdentityId: null,
    tags: [], estimatedMinutes: null, testData: "Original `fixture`", checklist: [], attachmentIds: [],
    steps: [{ id: "step-1", order: 1, action: "Pay", expectedResult: "Approved", required: true }],
    changeNote: "Created", createdAt: "2026-11-13T00:00:00Z",
  };
  const changed = { ...original, testData: "Changed fixture", description: "Keep description",
    tags: ["keep-tag"], steps: [{ ...original.steps[0], action: "Keep changed action" }] };
  const restored = restoreInspectorSection(changed, original, "testData");
  assert.equal(restored.testData, original.testData);
  assert.equal(restored.description, changed.description);
  assert.deepEqual(restored.tags, changed.tags);
  assert.deepEqual(restored.steps, changed.steps);
});
