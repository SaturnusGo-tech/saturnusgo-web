import { MissingYouTrackFieldError } from "./errors/fields/missing-configured-field-error";
import { reconcileLegacyWorkflow } from "../legacy/reconcile-legacy-workflow";
import { LegacyYouTrackMappingError } from "./errors/legacy-mapping-error";
import { discoverYouTrack } from "../../../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackRouteDraft } from "../../../../../youtrack/model/youtrack-settings";
import { discoverProjectDetails, uniqueProjectIds } from "../settings-support";

import { EmptyYouTrackFieldsError } from "./errors/catalog-error";

/** A project-only discovery response is not a replacement for a configured workflow. */
export async function discoverWorkflowCatalog(
  http: Parameters<typeof discoverYouTrack>[0],
  workspaceId: string,
  baseUrl: string,
  routes: readonly YouTrackRouteDraft[],
  apiToken: string,
  signal?: AbortSignal,
  configurationVersion = 2,
) {
  const catalog = await discoverYouTrack(http, workspaceId, { baseUrl, ...(apiToken ? { apiToken } : {}) }, signal);
  const ids = uniqueProjectIds(routes).filter(id => catalog.projects.some(project => project.id === id));
  const details = await discoverProjectDetails(http, workspaceId, baseUrl, ids, apiToken, signal);
  signal?.throwIfAborted();
  if (ids.some(id => !details.find(project => project.id === id)?.stateFields?.length)) {
    throw new EmptyYouTrackFieldsError();
  }
  const missingConfiguredField = routes.some(route => {
    if (!route.workflow.stateField.id || !ids.includes(route.project.id)) return false;
    const fields = details.find(project => project.id === route.project.id)?.stateFields;
    return !fields?.some(field => field.id === route.workflow.stateField.id);
  });
  if (missingConfiguredField) throw new MissingYouTrackFieldError();
  if (configurationVersion === 1 && routes.some(route => {
    if (!route.legacyKey || route.workflow.stateField.id) return false;
    const project = details.find(candidate => candidate.id === route.project.id);
    return !project || !reconcileLegacyWorkflow(route, project, configurationVersion);
  })) throw new LegacyYouTrackMappingError();
  return { catalog, details };
}
