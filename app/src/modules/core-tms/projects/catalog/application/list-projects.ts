import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { listProjectCatalog, type ProjectCatalogFilter } from "../data/project-catalog-api";

export async function loadProjectCatalog(http: TmsHttpClient, filter: ProjectCatalogFilter, cursor: string | null, signal?: AbortSignal) {
  return listProjectCatalog(http, filter, cursor, signal);
}
