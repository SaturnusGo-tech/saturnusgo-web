const parameter = "repositoryPortfolioId";
export function readRepositoryPortfolio(href: string, workspaceId?: string): string | null {
  const url = new URL(href);
  if (workspaceId && url.searchParams.get("workspaceId") !== workspaceId) return null;
  if (url.searchParams.get("view") && url.searchParams.get("view") !== "cases") return null;
  const value = url.searchParams.get(parameter);
  return value && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null;
}

export function repositoryScopeUrl(href: string, workspaceId: string, projectId: string, portfolioId: string | null) {
  const url = new URL(href);
  url.search = ""; url.hash = "";
  url.searchParams.set("workspaceId", workspaceId);
  if (projectId) url.searchParams.set("projectId", projectId);
  url.searchParams.set("view", "cases");
  if (portfolioId) url.searchParams.set(parameter, portfolioId);
  return url.toString();
}

export function preserveRepositoryScope(source: string, target: URL, workspaceId?: string) {
  const id = readRepositoryPortfolio(source, workspaceId);
  if (id) { target.searchParams.set("view", "cases"); target.searchParams.set(parameter, id); }
}
