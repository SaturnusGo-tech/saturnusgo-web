import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { listProjectCatalog } from "../../../projects/catalog/data/project-catalog-api";
import { loadPortfolioProjects } from "../repository-catalog";
import { loadRepositoryProject, type PortfolioCatalog, type RepositoryProject } from "../repository-content";

export async function loadSelectedRepository(http: TmsHttpClient, workspaceId: string,
  selection: { portfolioIds: readonly string[]; projectIds: readonly string[] }, signal: AbortSignal,
  onCatalog: (catalog: PortfolioCatalog) => void, onProject: (id: string, content: RepositoryProject | null) => void) {
  const projects = new Map<string, Project>();
  if (selection.portfolioIds.length) {
    for (const id of selection.portfolioIds) {
      signal.throwIfAborted();
      const catalog = await loadPortfolioProjects(http, workspaceId, id, signal);
      for (const project of catalog.projects) projects.set(project.id, project);
    }
  } else {
    let cursor: string | null = null; const seen = new Set<string>();
    do {
      signal.throwIfAborted();
      const page = await listProjectCatalog(http, { workspaceId, status: "active" }, cursor, signal);
      for (const project of page.items) if (selection.projectIds.includes(project.id)) projects.set(project.id, project);
      cursor = page.nextCursor;
      if (cursor && seen.has(cursor)) throw new Error("Project pagination did not advance.");
      if (cursor) seen.add(cursor);
    } while (cursor);
  }
  signal.throwIfAborted(); onCatalog({ portfolio: null, projects: [...projects.values()] });
  let index = 0; const items = [...projects.values()];
  async function worker() {
    while (index < items.length) {
      signal.throwIfAborted(); const project = items[index++];
      try { const content = await loadRepositoryProject(http, workspaceId, project.id, signal);
        signal.throwIfAborted(); onProject(project.id, content);
      } catch { signal.throwIfAborted(); onProject(project.id, null); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, worker));
}
