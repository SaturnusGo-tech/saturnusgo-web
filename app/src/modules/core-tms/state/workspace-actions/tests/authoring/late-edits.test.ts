import assert from "node:assert/strict";
import test from "node:test";
import { AuthoringLeaveCoordinator } from "../../../../authoring/leave/application/leave-coordinator";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import type { useWorkspaceActions } from "../../useWorkspaceActions";
import type { useWorkspaceResourceActions } from "../../../workspace-resources/useWorkspaceResourceActions";

function delayed<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test("project activation checks edits made while the destination was loading", async t => {
  const leave = new AuthoringLeaveCoordinator(); const h = componentHarness(); t.after(h.dispose);
  const load = delayed<{ testCases: []; runs: []; suites: [] }>();
  const events: string[] = []; let dirty = false; let prompts = 0;
  leave.register("case", () => ({ dirty }));
  leave.setPresenter(async () => { prompts++; return false; });
  Object.assign(h.window, { localStorage: { setItem() { events.push("remember"); } } });
  const { useWorkspaceActions: useActions } = h.load<{ useWorkspaceActions: typeof useWorkspaceActions }>(
    new URL("../../useWorkspaceActions.ts", import.meta.url), name => {
      if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: leave.request.bind(leave) };
      if (name.endsWith("run-history")) return { defaultWorkingRun: () => undefined };
    });
  const state = new Proxy({ projectId: "old", connection: "connected", isCaseSubmitting: () => false,
    loadProject: () => load.promise, data: { testCases: [], runs: [], suites: [] } }, {
    get(target, key) { return key in target ? target[key as keyof typeof target] : () => events.push(String(key)); },
  });
  const actions = h.render(() => useActions(state as never));
  const switchProject = actions.chooseProject("next");
  dirty = true; load.resolve({ testCases: [], runs: [], suites: [] });
  assert.equal(await switchProject, false); assert.equal(prompts, 1);
  assert.deepEqual(events.slice(), [], "Stay must retain all source selections, fields and project scope");
  leave.setPresenter(async () => true);
  assert.equal(await actions.chooseProject("next"), true);
  assert.ok(events.includes("resetCaseEditor")); assert.ok(events.includes("setProjectId"));
});

for (const resource of ["project", "environment"] as const) {
  test(`${resource} editor fetch cannot replace a form dirtied during the fetch`, async t => {
    const leave = new AuthoringLeaveCoordinator(); const h = componentHarness(); t.after(h.dispose);
    const load = delayed<{ data: { id: string }; etag: string }>();
    const dialogs: string[] = []; let dirty = false; let prompts = 0;
    leave.register("defect", () => ({ dirty }));
    leave.setPresenter(async () => { prompts++; return false; });
    const { useWorkspaceResourceActions: useActions } = h.load<{ useWorkspaceResourceActions: typeof useWorkspaceResourceActions }>(
      new URL("../../../workspace-resources/useWorkspaceResourceActions.ts", import.meta.url), name => {
        if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: leave.request.bind(leave) };
        if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
        if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
        if (name.endsWith("project-api")) return { getProject: () => load.promise };
        if (name.endsWith("environment-api")) return { getEnvironment: () => load.promise };
      });
    const state = { connection: "connected", data: { environments: [{ id: "env" }] },
      setDialog: (value: string) => dialogs.push(value) };
    const render = () => h.render(() => useActions(state as never, { project: { id: "p" } } as never, () => {}));
    const actions = render();
    const open = resource === "project" ? actions.openEditProject() : actions.openEditEnvironment("env");
    dirty = true; load.resolve({ data: { id: resource }, etag: "v1" });
    assert.equal(await open, false); assert.equal(prompts, 1); assert.deepEqual(dialogs, []);
    const current = render();
    assert.equal(current.projectEditor, null); assert.equal(current.environmentEditor, null);
  });
}
