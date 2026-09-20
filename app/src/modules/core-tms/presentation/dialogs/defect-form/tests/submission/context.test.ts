import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, type Node } from "../../../../../portfolios/tests/support/component-harness";
import type { WorkspaceExecutionDialogs } from "../../../../workspace-dialogs/WorkspaceExecutionDialogs";

test("opening a bug from Reports never attaches the last viewed run; creation from Runs retains its context", () => {
  const h = componentHarness();
  const { WorkspaceExecutionDialogs: View } = h.load<{ WorkspaceExecutionDialogs: typeof WorkspaceExecutionDialogs }>(
    new URL("../../../../workspace-dialogs/WorkspaceExecutionDialogs.tsx", import.meta.url), name =>
      name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "ru", t: (key: string) => key }) } : undefined);
  const run = { id: "old-run", status: "completed" }, item = { id: "old-item" };
  for (const view of ["reports", "cases", "runs"]) {
    const model = { view, dialog: "defect", project: { id: "current-project" }, data: { workspace: { id: "workspace" }, testCases: [] },
      projectCases: [], selectedRun: run, selectedRunItem: item, connection: "connected" };
    const node = h.render(() => View({ model } as never)) as unknown as Node;
    assert.equal(node.props.projectId, "current-project");
    assert.equal(node.props.run, view === "runs" ? run : null);
    assert.equal(node.props.item, view === "runs" ? item : null);
  }
  h.dispose();
});
