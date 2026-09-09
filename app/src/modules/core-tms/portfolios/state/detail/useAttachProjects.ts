import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { loadProjectCatalog } from "../../../projects/catalog/application/list-projects";
import { useCatalogPage } from "../catalog/useCatalogPage";

export function useAttachProjects(workspaceId: string) {
  const http = useTmsHttpClient();
  return useCatalogPage(`${workspaceId}:attach`, Boolean(workspaceId), (cursor, signal) => loadProjectCatalog(http,
    { workspaceId, status: "active", unassigned: true }, cursor, signal));
}
