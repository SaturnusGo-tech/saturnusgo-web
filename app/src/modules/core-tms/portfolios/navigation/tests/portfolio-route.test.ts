import assert from "node:assert/strict";
import { test } from "node:test";
import { portfolioRouteUrl, readPortfolioRoute } from "../portfolio-route";

test("catalog, portfolio and project routes survive reload and remove unrelated detail context", () => {
  const base = "https://tms.example.test/work/?workspaceId=one&projectId=old&view=cases&caseId=case-one&folderId=folder-one";
  const portfolio = portfolioRouteUrl(base, { kind: "portfolio", id: "portfolio-one" });
  assert.deepEqual(readPortfolioRoute(portfolio), { kind: "portfolio", id: "portfolio-one" });
  assert.equal(new URL(portfolio).searchParams.get("caseId"), null);
  const project = portfolioRouteUrl(portfolio, { kind: "project", id: "project-two" });
  assert.deepEqual(readPortfolioRoute(project), { kind: "project", id: "project-two" });
  assert.equal(new URL(project).searchParams.get("portfolioId"), null);
  assert.deepEqual(readPortfolioRoute(portfolioRouteUrl(project, { kind: "catalog" })), { kind: "catalog" });
});

test("untrusted and unrelated route values cannot select a resource", () => {
  assert.deepEqual(readPortfolioRoute("https://tms.example.test/?view=cases&portfolioId=one"), { kind: "catalog" });
  assert.deepEqual(readPortfolioRoute("https://tms.example.test/?view=portfolios&portfolioId=%3Cscript%3E"), { kind: "catalog" });
});
