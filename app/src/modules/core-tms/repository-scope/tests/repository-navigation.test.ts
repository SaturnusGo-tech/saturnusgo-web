import assert from "node:assert/strict";
import test from "node:test";
import { repositoryScopeUrl, readRepositoryPortfolio } from "../navigation/repository-scope";
import { buildCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
import { buildWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";

const base = "https://falcon.test/work/?workspaceId=w&projectId=a&view=cases&caseId=old";
test("choosing a portfolio clears old case selection; choosing its project returns a single-project scope", () => {
  const scoped = repositoryScopeUrl(base, "w", "a", "portfolio");
  assert.equal(readRepositoryPortfolio(scoped, "w"), "portfolio");
  assert.equal(new URL(scoped).searchParams.has("caseId"), false);
  const project = repositoryScopeUrl(scoped, "w", "b", null);
  assert.equal(readRepositoryPortfolio(project, "w"), null);
  assert.equal(new URL(project).searchParams.get("projectId"), "b");
});
test("opening a case in a second project and clearing selection preserve portfolio browsing", () => {
  const scoped = repositoryScopeUrl(base, "w", "a", "portfolio");
  const selected = buildCaseDeepLink(scoped, { workspaceId: "w", projectId: "b", caseId: "b-case" });
  assert.equal(readRepositoryPortfolio(selected, "w"), "portfolio");
  assert.equal(new URL(selected).searchParams.get("projectId"), "b");
  const cleared = buildWorkspaceDeepLink(selected, { workspaceId: "w", projectId: "b", view: "cases", runId: null });
  assert.equal(readRepositoryPortfolio(cleared, "w"), "portfolio");
});
test("portfolio browsing never leaks into another workspace or another feature", () => {
  const scoped = repositoryScopeUrl(base, "w", "a", "portfolio");
  assert.equal(readRepositoryPortfolio(scoped, "other"), null);
  const run = buildWorkspaceDeepLink(scoped, { workspaceId: "w", projectId: "a", view: "runs", runId: "run" });
  assert.equal(new URL(run).searchParams.has("repositoryPortfolioId"), false);
  const other = buildCaseDeepLink(scoped, { workspaceId: "other", projectId: "b", caseId: "b-case" });
  assert.equal(new URL(other).searchParams.has("repositoryPortfolioId"), false);
  assert.equal(readRepositoryPortfolio(scoped.replace("portfolio", "%3Cscript%3E")), null);
});
