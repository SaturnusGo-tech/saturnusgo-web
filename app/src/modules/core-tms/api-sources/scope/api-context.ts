import type { ApiContext } from "../model/api-source";
const valid = (value: string) => /^[A-Za-z0-9._:-]{1,128}$/.test(value);
export function readApiContext(href: string, projectId: string): ApiContext {
  const url = new URL(href); const portfolioId = url.searchParams.get("apiPortfolioId");
  if (portfolioId && valid(portfolioId)) return { portfolioId };
  const projectIds = [...new Set((url.searchParams.get("apiProjectIds") ?? "").split(",").filter(valid))].slice(0,100);
  return { projectIds: projectIds.length ? projectIds : projectId ? [projectId] : [] };
}
export function apiContextUrl(href: string, context: ApiContext) {
  const url = new URL(href); url.searchParams.delete("apiPortfolioId"); url.searchParams.delete("apiProjectIds");
  url.searchParams.delete("repositoryPortfolioId"); url.searchParams.set("view", "api");
  if (context.portfolioId) url.searchParams.set("apiPortfolioId", context.portfolioId);
  else if (context.projectIds?.length === 1) url.searchParams.set("projectId", context.projectIds[0]!);
  else if (context.projectIds?.length) url.searchParams.set("apiProjectIds", [...context.projectIds].sort().join(","));
  return url.toString();
}
export const apiContextKey = (context: ApiContext) => context.portfolioId ? `portfolio:${context.portfolioId}` : [...context.projectIds ?? []].sort().join(",");
