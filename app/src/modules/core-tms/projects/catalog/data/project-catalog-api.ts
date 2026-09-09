import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapProject } from "../../data/project-mapper";

export type ProjectCatalogFilter = Readonly<{ workspaceId: string; status: "active" | "archived"; portfolioId?: string; unassigned?: boolean }>;

export async function listProjectCatalog(http: TmsHttpClient, filter: ProjectCatalogFilter, cursor: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ workspaceId: filter.workspaceId, status: filter.status, limit: "100" });
  if (filter.portfolioId) query.set("portfolioId", filter.portfolioId);
  else if (filter.unassigned) query.set("unassigned", "true");
  if (cursor) query.set("cursor", cursor);
  const result = await http.get<components["schemas"]["ProjectListEnvelope"]>(`/projects?${query}`, signal);
  return { items: result.data.map(mapProject), nextCursor: result.meta.hasMore ? result.meta.nextCursor : null };
}
