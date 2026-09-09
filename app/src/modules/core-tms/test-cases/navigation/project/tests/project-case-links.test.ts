import assert from "node:assert/strict";
import test from "node:test";
import { buildCaseDeepLink } from "../../case-deep-link";
import { isProjectCaseContext } from "../project-case-context";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import { portfolioRouteUrl, readPortfolioRoute } from "../../../../portfolios/navigation/portfolio-route";

export const projectHref = "https://tms.example/work/?workspaceId=w&projectId=p&view=portfolios&catalogProjectId=p&projectTab=cases&folderId=transfers";
const parameters = (href: string) => Object.fromEntries(new URL(href).searchParams);
test("embedded case selection and inspector close retain the project page, case tab and folder", () => {
  const selected = buildCaseDeepLink(projectHref, { workspaceId: "w", projectId: "p", caseId: "case-7" }, { preserveProjectContext: true });
  assert.deepEqual(parameters(selected), { workspaceId: "w", projectId: "p", caseId: "case-7", view: "portfolios", catalogProjectId: "p", folderId: "transfers", projectTab: "cases" });
  assert.equal(isProjectCaseContext(selected), true);
  const closed = buildWorkspaceDeepLink(selected, { workspaceId: "w", projectId: "p", view: "portfolios", runId: null });
  assert.deepEqual(parameters(closed), parameters(projectHref));
  assert.deepEqual(readPortfolioRoute(closed), { kind: "project", id: "p" });
});
test("standalone case links and links to another workspace or project never adopt embedded context", () => {
  for (const [scope, preserve] of [[{ workspaceId: "w", projectId: "p" }, false], [{ workspaceId: "other", projectId: "p" }, true], [{ workspaceId: "w", projectId: "other" }, true]] as const) {
    const link = buildCaseDeepLink(projectHref, { ...scope, caseId: "case-9" }, { preserveProjectContext: preserve });
    assert.deepEqual(parameters(link), { ...scope, caseId: "case-9" });
  }
  const create = `${projectHref}&organizationCreate=project`;
  assert.equal(isProjectCaseContext(create), false);
  assert.equal(new URL(buildCaseDeepLink(create, { projectId: "p", caseId: "case-9" }, { preserveProjectContext: true })).searchParams.get("view"), null);
});
test("global project creation clears the previous project's case, folder and case-tab selectors", () => {
  const create = portfolioRouteUrl(`${projectHref}&caseId=case-7`, { kind: "project-create" });
  assert.deepEqual(parameters(create), { workspaceId: "w", projectId: "p", view: "portfolios", organizationCreate: "project" });
  assert.deepEqual(readPortfolioRoute(create), { kind: "project-create" });
  assert.deepEqual(parameters(buildWorkspaceDeepLink(create, { workspaceId: "w", projectId: "p", view: "portfolios", runId: null })), parameters(create));
});
test("opening another project drops all folder and tab state owned by the previous project", () => {
  const next = portfolioRouteUrl(`${projectHref}&caseId=case-7`, { kind: "project", id: "other" });
  assert.equal(new URL(next).searchParams.get("folderId"), null);
  assert.equal(new URL(next).searchParams.get("projectTab"), null);
  const settled = buildWorkspaceDeepLink(next, { workspaceId: "w", projectId: "other", view: "portfolios", runId: null });
  assert.equal(new URL(settled).searchParams.get("catalogProjectId"), "other");
  assert.equal(new URL(settled).searchParams.get("folderId"), null);
});
test("a mismatched URL scope cannot attach the old folder to a newly activated project's case", () => {
  const mismatched = projectHref.replace("catalogProjectId=p", "catalogProjectId=other");
  const next = buildCaseDeepLink(mismatched, { workspaceId: "w", projectId: "other", caseId: "other-case" }, { preserveProjectContext: true });
  assert.equal(new URL(next).searchParams.get("folderId"), null);
});

test("changing the global project selector cannot leave the previous embedded project selected", () => {
  const next = new URL(buildWorkspaceDeepLink(projectHref, { workspaceId: "w", projectId: "other", view: "portfolios", runId: null }));
  assert.notEqual(next.searchParams.get("catalogProjectId"), "p");
  assert.equal(next.searchParams.get("folderId"), null);
  assert.equal(next.searchParams.get("projectTab"), null);
});
