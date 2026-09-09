import type { PortfolioRoute } from "../model/portfolio";

export function readPortfolioRoute(href: string): PortfolioRoute {
  const params = new URL(href).searchParams;
  if (params.get("view") !== "portfolios") return { kind: "catalog" };
  const projectId = params.get("catalogProjectId");
  const portfolioId = params.get("portfolioId");
  if (projectId && /^[A-Za-z0-9._:-]{1,128}$/.test(projectId)) return { kind: "project", id: projectId };
  if (portfolioId && /^[A-Za-z0-9._:-]{1,128}$/.test(portfolioId)) return { kind: "portfolio", id: portfolioId };
  return { kind: "catalog" };
}

export function portfolioRouteUrl(href: string, route: PortfolioRoute) {
  const url = new URL(href);
  url.searchParams.set("view", "portfolios");
  for (const key of ["portfolioId", "catalogProjectId", "caseId", "runId", "runItemId", "suiteId", "defectId", "dashboardDetail"]) url.searchParams.delete(key);
  if (route.kind === "project") url.searchParams.set("catalogProjectId", route.id);
  if (route.kind === "portfolio") url.searchParams.set("portfolioId", route.id);
  return url.href;
}
