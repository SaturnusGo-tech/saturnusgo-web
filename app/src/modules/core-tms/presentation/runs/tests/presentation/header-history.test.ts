import assert from "node:assert/strict";
import test from "node:test";
import type { RunsView } from "../../RunsView";
import type { RunExecutionHeader } from "../../header/RunExecutionHeader";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
test("run history belongs to the header byline and never the case content", () => {
  const h = componentHarness();
  const { RunsView: View } = h.load<{ RunsView: typeof RunsView }>(new URL("../../RunsView.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("useScenarioLayout")) return { useScenarioLayout: () => ["list", () => {}] };
    if (name.endsWith("useLoadingFeedback")) return { useLoadingFeedback: () => false };
    if (name.endsWith("useRunFocus")) return { useRunFocus: () => ({ focused: false, ready: true }) };
    if (name.endsWith("useRunKeyboardShortcuts")) return { useRunKeyboardShortcuts() {} };
    if (name.endsWith("caseRevision")) return { executableSteps: () => [], casePriority: () => "none" };
    if (name.endsWith("labels")) return { localizedLabel: () => "Passed" };
    if (name.endsWith("executionStatus")) return { statusIcon: {} };
    if (name.endsWith("attempt-editing")) return { canEditRunAttempt: () => false };
  });
  const item = { id: "item", caseId: "source-case", revision: 4, activeAttemptNo: 2, rowVersion: 7, status: "passed", snapshot: {}, attempts: [{ attemptNo: 2, stepResults: [], attachmentIds: [] }] };
  const all = nodes(h.render(() => View({ workspaceId: "w", offline: false, cases: [{ id: "source-case", currentRevision: 99 }], selectedRun: { id: "run", projectId: "p" }, selectedItem: item, items: [item] } as unknown as Parameters<typeof RunsView>[0])));
  assert.equal(all.some(node => node.type === "ExecutionHistoryFeature"), false);
  const header = all.find(node => node.type === "RunExecutionHeader")!;
  const history = nodes(header.props.history)[0];
  assert.equal(history?.type, "ExecutionHistoryFeature");
  assert.deepEqual({ ...(history.props.scope as object) }, { workspaceId: "w", projectId: "p", runId: "run", itemId: "item" });
  const maintenance = nodes(header.props.actions)[0];
  assert.equal(maintenance?.type, "CaseMaintenanceFeature");
  assert.equal(maintenance.props.caseId, "source-case");
  assert.deepEqual({ ...(maintenance.props.source as object) }, { runId: "run", runItemId: "item", attemptNo: 2, revision: 4 });
  assert.equal(history.props.attemptNo, 2); assert.equal(history.props.version, 7);
  h.dispose();
});
test("execution header renders history and optional maintenance actions in its byline", () => {
  const h = componentHarness();
  const { RunExecutionHeader: Header } = h.load<{ RunExecutionHeader: typeof RunExecutionHeader }>(new URL("../../header/RunExecutionHeader.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("WorkspacePeopleContext")) return { useWorkspacePeople: () => ({ workspaceId: "w" }) };
    if (name.endsWith("labels")) return { localizedLabel: () => "Passed" };
    if (name.endsWith("executionStatus")) return { statusIcon: {} };
  });
  const history = { type: "history-action", props: {} }, actions = { type: "maintenance-action", props: {} };
  const all = nodes(h.render(() => Header({ run: {}, item: { snapshot: { title: "Case" }, status: "passed" }, history, actions } as unknown as Parameters<typeof Header>[0])));
  const byline = all.find(node => node.props.className === "headerByline")!;
  assert.ok(nodes(byline).includes(history)); assert.ok(nodes(byline).includes(actions));
});
