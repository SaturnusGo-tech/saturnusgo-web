import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "./hook-harness";
import { isProjectCaseContext } from "../../../../../test-cases/navigation/project/project-case-context";
import * as caseLinks from "../../../../../test-cases/navigation/case-deep-link";
import * as workspaceLinks from "../../../workspace-deep-link";
import { WorkspaceNavigationRestoration } from "../../../restoration/workspace-navigation-restoration";
import type { useWorkspaceHistory } from "../../useWorkspaceHistory";

const href = "https://tms.example/work/?workspaceId=w&projectId=p&view=portfolios&catalogProjectId=p&folderId=f";
function setup() {
  const h = hookHarness(href);
  const events: string[] = [];
  const state: Parameters<typeof useWorkspaceHistory>[0] = { workspaceId: "w", projectId: "p", view: "portfolios", runId: null, caseId: "", ready: true,
    setView: (view) => { state.view = view; events.push(`view:${view}`); },
    setCase: (id) => { state.caseId = id; events.push(`case:${id}`); },
    setRun: (id) => { state.runId = id; }, setItem() {}, closeDialog: () => events.push("close"), reload: () => events.push("reload") };
  const hook = h.load<{ useWorkspaceHistory: typeof useWorkspaceHistory }>(new URL("../../useWorkspaceHistory.ts", import.meta.url), (name) => {
    if (name.endsWith("project-case-context")) return { isProjectCaseContext };
    if (name.endsWith("case-deep-link")) return caseLinks;
    if (name.endsWith("workspace-deep-link")) return workspaceLinks;
    if (name.endsWith("workspace-navigation-restoration")) return { WorkspaceNavigationRestoration };
    if (name === "./workspace-history") return { initializeWorkspaceHistory() {}, navigateWorkspace: h.navigate };
    throw new Error(name);
  }).useWorkspaceHistory;
  const render = () => h.render(() => hook(state));
  render();
  return { h, state, events, render };
}
test("Back restores the embedded inspector; closing it and Forward retain the project view and folder URL", () => {
  const app = setup();
  app.h.window.location.href = `${href}&caseId=c`;
  app.h.emit("popstate");
  assert.equal(app.state.caseId, "c"); assert.equal(app.state.view, "portfolios");
  assert.equal(app.render().canWrite(), true);
  app.h.window.location.href = href; app.h.emit("popstate");
  assert.equal(app.state.caseId, ""); assert.equal(app.state.view, "portfolios");
  assert.equal(new URL(app.h.window.location.href).searchParams.get("folderId"), "f");
  app.h.window.location.href = `${href}&caseId=c`; app.h.emit("popstate");
  assert.equal(app.state.caseId, "c"); assert.ok(!app.events.includes("reload"));
  app.h.dispose();
});
test("cross-workspace or cross-project Back blocks URL writes until scoped data reloads", () => {
  for (const scope of [{ workspaceId: "other", projectId: "p" }, { workspaceId: "w", projectId: "other" }]) {
    const app = setup();
    app.h.window.location.href = `https://tms.example/work/?workspaceId=${scope.workspaceId}&projectId=${scope.projectId}&view=portfolios&catalogProjectId=${scope.projectId}&caseId=other-case`;
    app.h.emit("popstate");
    assert.deepEqual(app.events, ["close", "reload"]);
    assert.equal(app.state.caseId, ""); assert.equal(app.render().canWrite(), false);
    Object.assign(app.state, scope, { caseId: "other-case" });
    assert.equal(app.render().canWrite(), true);
    app.h.dispose();
  }
});
test("a mismatched catalog project or global creation destination cannot restore a stale inspector", () => {
  for (const suffix of ["&organizationCreate=project", "&organizationCreate=portfolio"]) {
    const app = setup();
    app.h.window.location.href = `${href}&caseId=c${suffix}`; app.h.emit("popstate");
    assert.equal(app.state.caseId, ""); assert.equal(app.state.view, "portfolios");
    app.h.dispose();
  }
  const app = setup();
  app.h.window.location.href = `${href.replace("catalogProjectId=p", "catalogProjectId=other")}&caseId=c`;
  app.h.emit("popstate"); assert.equal(app.state.caseId, ""); app.h.dispose();
});

test("a portfolio-only scope change releases restoration before opening a case in another project", () => {
  const app = setup();
  app.state.view = "cases"; app.render();
  app.h.window.location.href = "https://tms.example/work/?workspaceId=w&projectId=p&view=cases&repositoryPortfolioId=portfolio";
  app.h.emit("popstate");
  // React may skip selection effects because their primitive dependencies did not change.
  app.state.projectId = "other"; app.state.caseId = "other-case";
  assert.equal(app.render().canWrite(), true);
  assert.ok(!app.events.includes("reload"));
  app.h.dispose();
});
