import assert from "node:assert/strict";
import test from "node:test";
import { openRunNavigation } from "../open-run-navigation";
import { readWorkspaceDeepLink } from "../../navigation/workspace-deep-link";
import { WorkspaceNavigationRestoration } from "../../navigation/restoration/workspace-navigation-restoration";

test("opening a defect occurrence writes the exact run URL before clearing the report selection", () => {
  let href = "https://tms.example/work/?workspaceId=w&projectId=p&view=reports&defectId=d";
  const events: string[] = [];
  const restoration = new WorkspaceNavigationRestoration();
  restoration.begin({ workspaceId: "w", projectId: "p", view: "reports", runId: "old", caseId: "c" });
  openRunNavigation({ workspaceId: "w", projectId: "p", runId: "target", runItemId: "occurrence" }, {
    href,
    replace: (next) => { href = next; events.push("url"); },
    clearDefect: () => {
      assert.deepEqual(readWorkspaceDeepLink(href), { view: "runs", runId: "target", runItemId: "occurrence" });
      assert.equal(new URL(href).searchParams.has("defectId"), false);
      events.push("clear-defect");
    },
    selectRun: (id) => { assert.equal(id, "target"); events.push("run"); },
    selectItem: (id) => { assert.equal(id, "occurrence"); events.push("item"); },
    showRuns: () => { restoration.cancel(); events.push("view"); },
  });
  assert.deepEqual(events, ["url", "clear-defect", "run", "item", "view"]);
  assert.equal(restoration.canWrite({ workspaceId: "w", projectId: "p", view: "runs", runId: "target", caseId: "c" }), true);
  assert.deepEqual(Object.fromEntries(new URL(href).searchParams), {
    workspaceId: "w", projectId: "p", view: "runs", runId: "target", runItemId: "occurrence",
  });
  // Reload resolves the newly selected occurrence, including when an old report restoration was pending.
  assert.deepEqual(readWorkspaceDeepLink(href), { view: "runs", runId: "target", runItemId: "occurrence" });
});

test("opening a different run without an occurrence clears stale provider and item selectors", () => {
  let href = "https://tms.example/work/?workspaceId=old&projectId=old&view=hooks&integration=slack&runItemId=old";
  openRunNavigation({ workspaceId: "w", projectId: "p", runId: "r", runItemId: null }, {
    href, replace: (next) => { href = next; }, clearDefect: () => {}, selectRun: () => {},
    selectItem: (id) => assert.equal(id, null), showRuns: () => {},
  });
  assert.deepEqual(Object.fromEntries(new URL(href).searchParams), { workspaceId: "w", projectId: "p", view: "runs", runId: "r" });
});

test("run item restoration requires a valid run and never overrides an explicit other view", () => {
  for (const query of ["view=runs&runItemId=i", "view=runs&runId=../../bad&runItemId=i", "view=runs&runId=r&runItemId=../../bad"]) {
    assert.equal(readWorkspaceDeepLink(`https://tms.example/work/?${query}`).runItemId, undefined);
  }
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=config&runId=r&runItemId=i"), { view: "config", runId: null });
});
