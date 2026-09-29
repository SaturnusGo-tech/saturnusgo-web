import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { RunsView } from "../../RunsView";
import { runScopeState } from "../../state/run-view-state";

function setup() {
  const h = componentHarness(); let layout = "list"; let focused = false; const statuses: string[] = [];
  const { RunsView: render } = h.load<{ RunsView: typeof RunsView }>(new URL("../../RunsView.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("useScenarioLayout")) return { useScenarioLayout: () => [layout, (value: string) => { layout = value; }] };
    if (name.endsWith("useRunFocus")) return { useRunFocus: () => ({ focused, ready: true, toggle: () => { focused = !focused; } }) };
    if (name.endsWith("run-view-state")) return { runScopeState };
    if (name.endsWith("attempt-editing")) return { canEditRunAttempt: () => true };
    if (name.endsWith("caseRevision")) return { executableSteps: (snapshot: { steps: unknown[] }) => snapshot.steps };
    if (name.endsWith("labels")) return { localizedLabel: (_locale: string, value: string) => value };
    if (name.endsWith("executionStatus")) return { statusIcon: {} };
    if (name.endsWith("useRunKeyboardShortcuts")) return { useRunKeyboardShortcuts() {} };
  });
  const item = { id: "item", activeAttemptNo: 1, status: "not_run", snapshot: { title: "Check", type: "manual", steps: [
    { id: "step", order: 1, action: "Open", expectedResult: "Visible", required: true },
  ] }, attempts: [{ attemptNo: 1, attachmentIds: [], stepResults: [] }] };
  const props = { selectedRun: { id: "run", status: "active", projectId: "project" }, selectedItem: item, items: [item],
    cases: [], canExecute: true, onStepStatus: (_id: string, status: string) => statuses.push(status),
    onItemStatus: (status: string) => statuses.push(status), onStepActual() {}, onSaveStepActual: async () => true,
    onSelectItem() {}, onArchive() {}, onStart() {}, onDefectCreated() {},
  } as unknown as Parameters<typeof render>[0];
  return { all: () => nodes(h.render(() => render(props))), props, statuses };
}

test("run properties start collapsed and can be restored without changing execution data", () => {
  const { all, props } = setup(); const before = JSON.stringify(props.selectedItem);
  const rail = { inert: false }; invoke(all().find(n => n.props.className === "railSlot")!, "ref", rail); assert.equal(rail.inert, true);
  const header = all().find(n => n.type === "RunExecutionHeader")!;
  assert.equal(header.props.propertiesOpen, false);
  invoke(header, "onToggleProperties");
  assert.equal(all().find(n => n.type === "RunExecutionHeader")?.props.propertiesOpen, true);
  invoke(all().find(n => n.props.className === "railSlot")!, "ref", rail); assert.equal(rail.inert, false);
  assert.equal(JSON.stringify(props.selectedItem), before);
});

test("focus hides both panels together, keeps execution mounted and restores the prior properties choice", () => {
  const { all, props, statuses } = setup(); const before = JSON.stringify(props.selectedItem);
  invoke(all().find(n => n.type === "RunExecutionHeader")!, "onToggleProperties");
  invoke(all().find(n => n.props["data-run-panel-handle"] !== undefined)!, "onClick");
  assert.equal(all().find(n => n.props["data-testid"] === "runs-view")?.props["data-run-focused"], true);
  assert.equal(all().find(n => n.type === "RunExecutionHeader")?.props.propertiesOpen, false);
  const navigation = { inert: false }; invoke(all().find(n => n.props.className === "navigator navigator")!, "ref", navigation); assert.equal(navigation.inert, true);
  assert.ok(all().find(n => n.props["data-testid"] === "pass-case"));
  invoke(all().find(n => n.props["data-run-panel-handle"] !== undefined)!, "onClick");
  assert.equal(all().find(n => n.type === "RunExecutionHeader")?.props.propertiesOpen, true);
  assert.equal(JSON.stringify(props.selectedItem), before); assert.deepEqual(statuses, []);
});

test("a focused run with no visible case still offers a way back to its repository", () => {
  const { all, props } = setup();
  invoke(all().find(n => n.props["data-run-panel-handle"] !== undefined)!, "onClick");
  props.selectedItem = null; props.items = []; props.scopeLoading = false;
  const restore = all().find(n => n.type === "button" && n.props["aria-label"] === "Show case list");
  assert.ok(restore); invoke(restore, "onClick");
  assert.equal(all().find(n => n.props["data-testid"] === "runs-view")?.props["data-run-focused"], false);
});

test("layout switching preserves step identity and does not execute or modify the snapshot", () => {
  const { all, props, statuses } = setup(); const before = JSON.stringify(props.selectedItem);
  const toggle = all().find(n => n.type === "ScenarioLayoutToggle")!;
  assert.ok(toggle); invoke(toggle, "onChange", "grid");
  assert.equal(all().find(n => n.props["data-scenario-layout"] === "grid")?.props["data-scenario-layout"], "grid");
  assert.equal(JSON.stringify(props.selectedItem), before); assert.deepEqual(statuses, []);
  assert.ok(all().find(n => n.type === "ScenarioMarkdown" && n.props.value === "Open"));
  assert.ok(all().find(n => n.type === "ScenarioMarkdown" && n.props.value === "Visible"));
});

test("required-step, pending and unsaved-actual-result guards survive the new layout", () => {
  const { all, props } = setup();
  assert.equal(all().find(n => n.props["data-testid"] === "pass-case")?.props.disabled, true);
  props.executionPending = true;
  assert.equal(all().find(n => n.props["aria-label"] === "runs.fail")?.props.disabled, true);
  props.executionPending = false;
  props.selectedItem!.attempts[0].stepResults = [{ stepId: "step", status: "passed", actualResult: "Draft", attachmentIds: [] }] as never;
  assert.equal(all().find(n => n.props["data-testid"] === "pass-case")?.props.disabled, false);
  invoke(all().find(n => n.type === "StepActualEditor")!, "onDirtyChange", true);
  assert.equal(all().find(n => n.props["data-testid"] === "pass-case")?.props.disabled, true);
  assert.equal(all().find(n => n.props["aria-label"] === "runs.passStep 1")?.props.disabled, true);
});

test("grid closes properties and does not restore them when leaving focus mode", () => {
  const { all } = setup();
  invoke(all().find(n => n.type === "RunExecutionHeader")!, "onToggleProperties");
  invoke(all().find(n => n.type === "ScenarioLayoutToggle")!, "onChange", "grid");
  assert.equal(all().find(n => n.type === "RunExecutionHeader")?.props.propertiesOpen, false);
  invoke(all().find(n => n.props["data-run-panel-handle"] !== undefined)!, "onClick");
  invoke(all().find(n => n.props["data-run-panel-handle"] !== undefined)!, "onClick");
  assert.equal(all().find(n => n.type === "RunExecutionHeader")?.props.propertiesOpen, false);
});
test("only a writable blocked case offers unblock and guards pending execution", () => {
  const { all, props } = setup(); let calls = 0;
  props.onUnblock = () => { calls++; };
  assert.equal(all().some(n => n.props["data-testid"] === "unblock-case"), false);
  props.selectedItem!.status = "blocked";
  invoke(all().find(n => n.props["data-testid"] === "unblock-case")!, "onClick");
  assert.equal(calls, 1);
  props.executionPending = true;
  assert.equal(all().find(n => n.props["data-testid"] === "unblock-case")?.props.disabled, true);
  props.canExecute = false;
  assert.equal(all().some(n => n.props["data-testid"] === "unblock-case"), false);
});
