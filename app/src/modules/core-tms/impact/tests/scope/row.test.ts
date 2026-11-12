import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { ScopeTestRow } from "../../presentation/scope/ScopeTestRow";

function setup(overrides: Partial<Parameters<typeof ScopeTestRow>[0]> = {}) {
  const harness = componentHarness(); let toggles = 0;
  const { ScopeTestRow: Row } = harness.load<{ ScopeTestRow: typeof ScopeTestRow }>(
    new URL("../../presentation/scope/ScopeTestRow.tsx", import.meta.url));
  const props: Parameters<typeof Row>[0] = { caseId: "case", caseKey: "HOST-TC-120", title: "Keep the reviewed case title",
    revision: 4, origin: "manual", included: true, editable: true, ru: false, onToggle: () => { toggles++; },
    selection: { testCaseId: "case", confidence: .85, reason: "The changed authorization path requires verification.", changedFiles: ["auth/access.ts"] }, ...overrides };
  return { harness, props, render: () => nodes(harness.render(() => Row(props))), toggles: () => toggles };
}
test("scope inclusion delegates to server truth without optimistically toggling", () => {
  const view = setup(); let all = view.render();
  const checkbox = all.find(node => node.type === "IntegrationCheckbox")!;
  assert.equal(checkbox.props.isSelected, true); assert.equal(checkbox.props.isDisabled, false);
  invoke(checkbox, "onValueChange"); assert.equal(view.toggles(), 1);
  all = view.render(); assert.equal(all.find(node => node.type === "IntegrationCheckbox")!.props.isSelected, true);
  view.props.included = false;
  assert.equal(view.render().find(node => node.type === "IntegrationCheckbox")!.props.isSelected, false);
  view.harness.dispose();
});
test("read-only scope rows disable inclusion", () => {
  const view = setup({ editable: false });
  const checkbox = view.render().find(node => node.type === "IntegrationCheckbox")!;
  assert.equal(checkbox.props.isDisabled, true); invoke(checkbox, "onValueChange"); assert.equal(view.toggles(), 0);
  view.harness.dispose();
});
test("pending blocks writes without disabling or dimming unrelated checkboxes", () => {
  const view = setup({ pending: true }); let all = view.render();
  const checkbox = all.find(node => node.type === "IntegrationCheckbox")!;
  assert.equal(checkbox.props.isDisabled, false); assert.equal(checkbox.props["aria-disabled"], true);
  invoke(checkbox, "onValueChange"); assert.equal(view.toggles(), 0);
  assert.equal(all.some(node => node.props.role === "status"), false);
  view.props.saving = true; all = view.render();
  assert.equal(all.find(node => node.type === "IntegrationCheckbox")!.props.isSelected, true);
  assert.equal(all.filter(node => node.props.role === "status").length, 1);
  view.harness.dispose();
});
test("persistent evidence becomes accessible only while expanded and retains the exact reason and paths", () => {
  const view = setup(); let all = view.render();
  const panel = () => all.find(node => node.props.className === "reveal")!;
  const dom = { inert: false };
  invoke(panel(), "ref", dom); assert.equal(dom.inert, true);
  assert.equal(panel().props["aria-hidden"], true);
  const toggle = all.find(node => node.type === "IntegrationButton")!;
  assert.equal(toggle.props["aria-expanded"], false);
  assert.equal(toggle.props["aria-controls"], panel().props.id);
  invoke(toggle, "onPress"); all = view.render();
  invoke(panel(), "ref", dom); assert.equal(dom.inert, false);
  assert.equal(panel().props["aria-hidden"], false);
  assert.equal(all.find(node => node.type === "IntegrationButton")!.props["aria-expanded"], true);
  assert.ok(all.some(node => node.type === "p" && node.props.children === view.props.selection!.reason));
  assert.ok(all.some(node => node.type === "li" && node.props.title === "auth/access.ts"));
  assert.ok(all.some(node => node.type === "strong" && node.props.children === "access.ts"));
  assert.ok(all.some(node => node.type === "small" && node.props.children === "auth"));
  assert.deepEqual(view.props.selection!.changedFiles, ["auth/access.ts"]); assert.equal(view.toggles(), 0);
  invoke(all.find(node => node.type === "IntegrationButton")!, "onPress");
  all = view.render(); invoke(panel(), "ref", dom);
  assert.equal(dom.inert, true); assert.equal(panel().props["aria-hidden"], true); view.harness.dispose();
});
test("recommendations retain their evidence without implying editable inclusion", () => {
  const view = setup({ included: undefined, editable: false });
  const all = view.render(); assert.equal(all.some(node => node.type === "IntegrationCheckbox"), false);
  assert.ok(all.some(node => node.type === "IntegrationButton" && node.props["aria-expanded"] === false)); view.harness.dispose();
});
