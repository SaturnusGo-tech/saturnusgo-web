import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { listTestCases } from "../../test-cases/data/test-case-api";
import { listFolders } from "../../folders/data/folder-api";
import { loadPortfolioProjects } from "./repository-catalog";

export async function loadRepositoryProject(http: TmsHttpClient, workspaceId: string, projectId: string, signal: AbortSignal) {
  const [cases, folders] = await Promise.all([listTestCases(http, projectId, signal), listFolders(http, { workspaceId, projectId }, signal)]);
  signal.throwIfAborted();
  if (cases.items.some(item => item.projectId !== projectId)
    || folders.some(item => item.projectId !== projectId || item.workspaceId !== workspaceId)) throw new Error("Repository scope mismatch.");
  return { cases: cases.items, folders };
}

export type PortfolioCatalog = Awaited<ReturnType<typeof loadPortfolioProjects>>;
export type RepositoryProject = Awaited<ReturnType<typeof loadRepositoryProject>>;

export async function loadPortfolioRepository(http: TmsHttpClient, workspaceId: string, portfolioId: string, signal: AbortSignal,
  onCatalog: (catalog: PortfolioCatalog) => void, onProject: (projectId: string, content: RepositoryProject | null) => void) {
  const catalog = await loadPortfolioProjects(http, workspaceId, portfolioId, signal);
  signal.throwIfAborted(); onCatalog(catalog);
  let index = 0;
  async function worker() {
    while (index < catalog.projects.length) {
      signal.throwIfAborted();
      const project = catalog.projects[index++];
      try {
        const content = await loadRepositoryProject(http, workspaceId, project.id, signal);
        signal.throwIfAborted(); onProject(project.id, content);
      } catch (error) { signal.throwIfAborted(); onProject(project.id, null); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, catalog.projects.length) }, worker));
}
