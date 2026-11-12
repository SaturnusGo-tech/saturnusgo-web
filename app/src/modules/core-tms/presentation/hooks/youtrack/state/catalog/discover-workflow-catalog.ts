import { discoverYouTrack } from "../../../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackRouteDraft } from "../../../../../youtrack/model/youtrack-settings";
import { discoverProjectDetails, uniqueProjectIds } from "../settings-support";

import { EmptyYouTrackFieldsError } from "./errors/catalog-error";

/** A project-only discovery response is not a replacement for a configured workflow. */
export async function discoverWorkflowCatalog(http: Parameters<typeof discoverYouTrack>[0], workspaceId: string,
  baseUrl: string, routes: readonly YouTrackRouteDraft[], apiToken: string, signal?: AbortSignal) {
  const catalog = await discoverYouTrack(http, workspaceId, { baseUrl, ...(apiToken ? { apiToken } : {}) }, signal);
  const ids = uniqueProjectIds(routes).filter(id => catalog.projects.some(project => project.id === id));
  const details = await discoverProjectDetails(http, workspaceId, baseUrl, ids, apiToken, signal);
  signal?.throwIfAborted();
  if (ids.some(id => !details.find(project => project.id === id)?.stateFields?.length)) throw new EmptyYouTrackFieldsError();
  return { catalog, details };
}
