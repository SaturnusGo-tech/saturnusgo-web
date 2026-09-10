import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { listProjectCatalog, type ProjectCatalogFilter } from "../data/project-catalog-api";

export async function loadProjectCatalog(http: TmsHttpClient, filter: ProjectCatalogFilter, cursor: string | null, signal?: AbortSignal) {
  return listProjectCatalog(http, filter, cursor, signal);
}

/** The navigation catalog is independent of the currently selected project or portfolio. */
export async function loadAllWorkspaceProjects(http: TmsHttpClient, workspaceId: string, signal?: AbortSignal) {
  const projects = new Map<string, Awaited<ReturnType<typeof listProjectCatalog>>["items"][number]>();
  const cursors = new Set<string>();
  let cursor: string | null = null;
  do {
    signal?.throwIfAborted();
    const page = await listProjectCatalog(http, { workspaceId, status: "active" }, cursor, signal);
    for (const project of page.items) projects.set(project.id, project);
    cursor = page.nextCursor;
    if (cursor && cursors.has(cursor)) throw new Error("Project pagination did not advance.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  signal?.throwIfAborted();
  return [...projects.values()];
}
