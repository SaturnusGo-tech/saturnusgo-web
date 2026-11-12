import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../../../../portfolios/tests/support/component-harness";
import type { DefectIntake } from "../DefectIntake";

test("triage list activation opens the matching defect and dismiss restores the initiating option", () => {
  let focused = 0;
  const option = { focus: () => { focused++; } };
  const h = componentHarness(undefined, { document: { activeElement: option }, requestAnimationFrame: (fn: () => void) => fn() });
  const rows = [{ id: "first", title: "First defect" }, { id: "second", title: "Second defect" }];
  const state = { list: { rows, loading: false }, saving: false, clearDecision() {} };
  const { DefectIntake: View } = h.load<{ DefectIntake: typeof DefectIntake }>(new URL("../DefectIntake.tsx", import.meta.url), name => {
    if (name.endsWith("useDefectIntake")) return { useDefectIntake: () => state };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("triage-copy")) return { triageCopy: { en: { inbox: "Inbox" } } };
    if (name.endsWith("DashboardReadiness")) return { useDashboardWidgetPending() {} };
  });
  const render = () => nodes(h.render(() => View({ scope: { workspaceId: "w", projectId: "p" }, view: "inbox", canManage: true, onChange() {} })));
  const list = render().find(node => node.type === "Listbox");
  assert.ok(list, "uses HeroUI's keyboard-navigable list");
  assert.equal(typeof list.props.onSelectionChange, "function", "handles selection after the first row is already selected");
  invoke(list, "onSelectionChange", new Set(["second"]));
  const detail = render().find(node => node.type === "DefectDetails");
  assert.equal((detail?.props.row as typeof rows[number]).id, "second");
  invoke(render().find(node => node.type === "Listbox")!, "onSelectionChange", new Set(["first"]));
  assert.equal((render().find(node => node.type === "DefectDetails")?.props.row as typeof rows[number]).id, "first");
  invoke(detail!, "onDismiss");
  assert.equal(render().some(node => node.type === "DefectDetails"), false);
  assert.equal(focused, 1);
  state.saving = true;
  assert.deepEqual(render().find(node => node.type === "Listbox")?.props.disabledKeys, ["first", "second"]);
  h.dispose();
});
