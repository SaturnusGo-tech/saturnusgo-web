import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { RunDialog } from "../../../dialogs/run/RunDialog";

// Run creation must share repository row semantics without changing its selection rules.
test("new run uses repository filters and single-line priority rows while preserving suite selection", () => {
  const h = componentHarness();
  const cases = [{ id: "case-a", projectId: "project-a" }, { id: "case-b", projectId: "project-b" }];
  let selected: string[] = [];
  const state = { projectIds: ["project-a", "project-b"], visibleCases: cases, caseIds: [], suiteId: "suite-a", iterations: [],
    catalog: {}, platformBuilds: { drafts: {} }, loading: false, busy: false, tags: "", build: "", name: "Release",
    setCaseIds: (update: (ids: string[]) => string[]) => { selected = update(selected); } };
  const { RunDialog: View } = h.load<{ RunDialog: typeof RunDialog }>(new URL("../../../dialogs/run/RunDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useFormLeave")) return { useFormLeave: () => ({ release() {}, close: (action: () => void) => action() }) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useBatchComposer")) return { useBatchComposer: () => state };
    if (name.endsWith("useDrawerDismiss")) return { useDrawerDismiss: () => ({ closing: false, dismiss() {}, panelRef: { current: null } }) };
    if (name.endsWith("SelectionControls")) return { SelectionControls: "SelectionControls", useSelectionFilters: () => ({ visible: cases }) };
  });
  const props = { project: { id: "project-a" }, data: { workspace: { id: "workspace" }, suites: [{ id: "suite-a", name: "Smoke" }], projects: [] },
    presetCaseIds: [], selectedSuiteId: "suite-a", offline: false, onClose() {}, onCreated() {} } as unknown as Parameters<typeof View>[0];
  const all = nodes(h.render(() => View(props)));
  const controls = all.find(node => node.type === "SelectionControls")!;
  assert.equal(controls.props.repository, true);
  assert.ok(all.filter(node => node.type === "SelectionTree").every(node => node.props.titleMode === "inline"));
  invoke(controls, "onSelectAll");
  assert.deepEqual(Array.from(selected), ["case-b"], "suite membership stays server-owned and is not explicitly selected again");
  h.dispose();
});
