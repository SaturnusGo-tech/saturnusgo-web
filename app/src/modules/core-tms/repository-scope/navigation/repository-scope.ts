const parameter = "repositoryPortfolioId";
const projectsParameter = "repositoryProjectId";
const valid = (value: string) => /^[A-Za-z0-9._:-]{1,128}$/.test(value);
export function readRepositorySelection(href: string, workspaceId?: string) {
  const url = new URL(href);
  if ((workspaceId && url.searchParams.get("workspaceId") !== workspaceId)
    || (url.searchParams.get("view") && url.searchParams.get("view") !== "cases")) return { portfolioIds: [], projectIds: [] };
  const portfolioIds = [...new Set(url.searchParams.getAll(parameter).filter(valid))];
  const projectIds = portfolioIds.length ? [] : [...new Set(url.searchParams.getAll(projectsParameter).filter(valid))];
  return { portfolioIds, projectIds };
}
export function readRepositoryPortfolio(href: string, workspaceId?: string): string | null {
  return readRepositorySelection(href, workspaceId).portfolioIds[0] ?? null;
}
export function repositoryScopeUrl(href: string, workspaceId: string, projectId: string, portfolioId: string | null,
  selection?: { portfolioIds: readonly string[]; projectIds: readonly string[] }) {
  const url = new URL(href);
  url.search = ""; url.hash = "";
  url.searchParams.set("workspaceId", workspaceId);
  if (projectId) url.searchParams.set("projectId", projectId);
  url.searchParams.set("view", "cases");
  const portfolios = selection?.portfolioIds ?? (portfolioId ? [portfolioId] : []);
  for (const id of new Set(portfolios.filter(valid))) url.searchParams.append(parameter, id);
  if (!portfolios.length) for (const id of new Set(selection?.projectIds.filter(valid) ?? [])) url.searchParams.append(projectsParameter, id);
  return url.toString();
}
export function preserveRepositoryScope(source: string, target: URL, workspaceId?: string) {
  const selection = readRepositorySelection(source, workspaceId);
  for (const id of selection.portfolioIds) target.searchParams.append(parameter, id);
  for (const id of selection.projectIds) target.searchParams.append(projectsParameter, id);
  if (selection.portfolioIds.length || selection.projectIds.length) target.searchParams.set("view", "cases");
}
