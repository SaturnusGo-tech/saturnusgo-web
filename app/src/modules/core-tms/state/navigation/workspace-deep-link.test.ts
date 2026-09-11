import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "./workspace-deep-link";
import { buildDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { buildCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
import { WorkspaceNavigationRestoration } from "./restoration/workspace-navigation-restoration";
import { workspaceViews } from "../types/workspace";

test("GitHub and Slack run links restore the exact run, never the first active run", () => {
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?workspaceId=w&projectId=p&runId=run_42&view=runs"),
    { view: "runs", runId: "run_42" });
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?runId=../../foreign"), { view: null, runId: null });
});
test("all integration details restore their view and invalid providers do not", () => {
  for (const provider of ["jira", "trello", "linear", "github", "slack", "confluence", "youtrack"]) {
    assert.deepEqual(readWorkspaceDeepLink(`https://tms.example/work/?integration=${provider}`), { view: "hooks", runId: null });
  }
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?integration=unknown"), { view: null, runId: null });
});
test("an explicit destination wins over stale selectors from another screen", () => {
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=hooks&integration=slack&runId=old&defectId=old"),
    { view: "hooks", runId: null });
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=runs&runId=selected&defectId=old&integration=slack"),
    { view: "runs", runId: "selected" });
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=reports&runId=old&integration=slack"),
    { view: "reports", runId: null });
});

test("bootstrap or hot reload cannot write a previous selection before restoration commits", () => {
  const restoration = new WorkspaceNavigationRestoration();
  const restored = { workspaceId: "w", projectId: "p", view: "hooks" as const, runId: "active", caseId: "case" };
  const staleRun = { ...restored, view: "runs" as const };
  let href = "https://tms.example/work/?workspaceId=w&projectId=p&view=hooks&integration=slack";
  restoration.begin(restored);
  if (restoration.canWrite(staleRun)) href = buildWorkspaceDeepLink(href, staleRun);
  assert.equal(new URL(href).searchParams.get("integration"), "slack");
  assert.equal(restoration.canWrite({ ...restored, projectId: "previous-project" }), false);
  assert.equal(restoration.canWrite({ ...restored, caseId: "previous-case" }), false);
  assert.equal(restoration.canWrite(restored), true);
  // After the restored commit, normal user navigation is free to select another run.
  assert.equal(restoration.canWrite({ ...staleRun, runId: "new-run" }), true);
  // A second restoration is guarded even when bootstrap generation was preserved by HMR.
  restoration.begin(restored);
  assert.equal(restoration.canWrite(staleRun), false);
  assert.equal(restoration.canWrite(restored), true);
});
test("changing project preserves a provider and removes conflicting run or defect selections", () => {
  const input = { workspaceId: "workspace-a", projectId: "project-b", view: "hooks" as const, runId: null };
  const url = new URL(buildWorkspaceDeepLink("https://tms.example/work/?integration=trello&runId=old&defectId=old&caseId=old", input));
  assert.deepEqual(Object.fromEntries(url.searchParams), { workspaceId: "workspace-a", projectId: "project-b", view: "hooks", integration: "trello" });
  const run = new URL(buildWorkspaceDeepLink(url.toString(), { ...input, view: "runs", runId: "run-new" }));
  assert.equal(run.searchParams.get("integration"), null);
  assert.equal(run.searchParams.get("runId"), "run-new");
});

test("a defect opened from a run restores reports without stale run or integration selection", () => {
  const href = buildDefectDeepLink("https://tms.example/work/?workspaceId=w&projectId=p&runId=r&runItemId=i&caseId=c&integration=linear", {
    projectId: "p", defectId: "d",
  });
  assert.deepEqual(Object.fromEntries(new URL(href).searchParams), {
    workspaceId: "w", projectId: "p", view: "reports", defectId: "d",
  });
  assert.deepEqual(readWorkspaceDeepLink(href), { view: "reports", runId: null });
  for (const name of ["defectId", "defect"]) {
    assert.deepEqual(readWorkspaceDeepLink(`https://tms.example/work/?${name}=d&runId=r&integration=linear`),
      { view: "reports", runId: null });
  }
});

test("returning from a defect to cases keeps workspace scope and clears the report selection", () => {
  const href = buildCaseDeepLink("https://tms.example/work/?workspaceId=w&projectId=p&view=reports&defectId=d", {
    projectId: "p", caseId: "c",
  });
  assert.deepEqual(Object.fromEntries(new URL(href).searchParams), { workspaceId: "w", projectId: "p", caseId: "c" });
  assert.deepEqual(readWorkspaceDeepLink(href), { view: null, runId: null });
  const moved = new URL(buildCaseDeepLink(href, { workspaceId: "w2", projectId: "p2", caseId: "c2" }));
  assert.equal(moved.searchParams.get("workspaceId"), "w2");
});

test("opening Config from an integration replaces the URL and reload restores Config", () => {
  const previous = "https://tms.example/work/?workspaceId=w&projectId=p&view=hooks&integration=slack&runId=old";
  const config = buildWorkspaceDeepLink(previous, { workspaceId: "w", projectId: "p", view: "config", runId: "active" });
  assert.deepEqual(Object.fromEntries(new URL(config).searchParams), { workspaceId: "w", projectId: "p", view: "config" });
  assert.deepEqual(readWorkspaceDeepLink(config), { view: "config", runId: null });
  for (const view of workspaceViews) {
    const href = buildWorkspaceDeepLink(config, { workspaceId: "w", projectId: "p", view, runId: "active" });
    assert.deepEqual(readWorkspaceDeepLink(href), { view, runId: view === "runs" ? "active" : null });
  }
});

test("reports preserve a scoped detail and closing it restores the report list after reload", () => {
  const previous = "https://tms.example/work/?workspaceId=w&projectId=p&view=reports&defectId=d";
  const reports = buildWorkspaceDeepLink(previous, { workspaceId: "w", projectId: "p", view: "reports", runId: "active" });
  assert.equal(new URL(reports).searchParams.get("defectId"), "d");
  const list = buildDefectDeepLink(reports, { projectId: "p", defectId: null });
  assert.equal(new URL(list).searchParams.get("defectId"), null);
  assert.deepEqual(readWorkspaceDeepLink(list), { view: "reports", runId: null });
  for (const scope of [{ workspaceId: "other", projectId: "p" }, { workspaceId: "w", projectId: "other" }]) {
    const moved = buildWorkspaceDeepLink(previous, { ...scope, view: "reports", runId: null });
    assert.equal(new URL(moved).searchParams.get("defectId"), null);
  }
});

test("retired integration testing links open the repository without changing connector routes", () => {
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=integrations"), { view: "cases", runId: null });
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=api"), { view: "api", runId: null });
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=hooks&integration=swagger"), { view: "hooks", runId: null });
});

test("portfolio detail survives project changes, while embedded project detail follows the active project", () => {
  const base = "https://tms.example/work/?workspaceId=w&projectId=p&view=portfolios";
  const input = { workspaceId: "w", projectId: "other-project", view: "portfolios" as const, runId: null };
  const portfolio = `${base}&portfolioId=detail`;
  assert.equal(new URL(buildWorkspaceDeepLink(portfolio, input)).searchParams.get("portfolioId"), "detail");
  assert.equal(new URL(buildWorkspaceDeepLink(portfolio, { ...input, workspaceId: "other-workspace" })).searchParams.get("portfolioId"), null);
  const project = `${base}&catalogProjectId=p`;
  assert.equal(new URL(buildWorkspaceDeepLink(project, { ...input, projectId: "p" })).searchParams.get("catalogProjectId"), "p");
  assert.equal(new URL(buildWorkspaceDeepLink(project, input)).searchParams.get("catalogProjectId"), null);
  const activating = `${base}&catalogProjectId=other-project`;
  assert.equal(new URL(buildWorkspaceDeepLink(activating, input)).searchParams.get("catalogProjectId"), "other-project");
  assert.equal(new URL(buildWorkspaceDeepLink(activating, { ...input, workspaceId: "other-workspace" })).searchParams.get("catalogProjectId"), null);
});

test("report comment canonicalization is stable and never carries across companies, projects or views", () => {
 const href="https://company.test/work/?workspaceId=w&projectId=p&view=reports&defectId=d&commentId=c";
 const scope={workspaceId:"w",projectId:"p",view:"reports" as const,runId:null};
 const canonical=buildWorkspaceDeepLink(href,scope);
 assert.equal(new URL(canonical).searchParams.get("commentId"),"c");
 assert.equal(buildWorkspaceDeepLink(canonical,scope),canonical);
 for(const next of [{...scope,workspaceId:"other"},{...scope,projectId:"other"},{...scope,view:"cases" as const}])
  assert.equal(new URL(buildWorkspaceDeepLink(href,next)).searchParams.has("commentId"),false);
 assert.equal(new URL(buildDefectDeepLink(href,{projectId:"p",defectId:"other"})).searchParams.has("commentId"),false);
 assert.equal(new URL(buildDefectDeepLink(href,{projectId:"p",defectId:null})).searchParams.has("commentId"),false);
});
