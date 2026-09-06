import { discoverYouTrack } from "../../../../application/integrations/getYouTrackIntegrationStatus";
import type {
  YouTrackConfiguration,
  YouTrackConfigurationDraft,
  YouTrackProject,
  YouTrackRouteDraft,
  YouTrackStateField,
  YouTrackDraftIssue,
} from "../../../../youtrack/model/youtrack-settings";
import type { HooksCopy } from "../../shared/hooks-copy";

type ApiErrorShape = Readonly<{ status?: unknown; code?: unknown }>;
type DiscoveryClient = Parameters<typeof discoverYouTrack>[0];

export function projectsFromConfiguration(configuration: YouTrackConfiguration): YouTrackProject[] {
  const grouped = new Map<string, YouTrackProject>();
  for (const route of configuration.routes ?? []) {
    const stateField = route.workflow.stateField;
    const existing = grouped.get(route.project.id);
    const fields = stateField ? appendStateField(existing?.stateFields, {
      id: stateField.id, name: stateField.name, statuses: route.workflow.statuses,
    }) : existing?.stateFields;
    grouped.set(route.project.id, { ...route.project, ...(fields ? { stateFields: fields } : {}) });
  }
  if (grouped.size > 0) return [...grouped.values()];
  return Object.values(configuration.targets ?? {}).flatMap((project) => project
    ? [{ id: project.projectId, shortName: project.shortName, name: project.shortName, stateFields: [] }]
    : []);
}

function appendStateField(
  fields: readonly YouTrackStateField[] | undefined,
  field: YouTrackStateField,
): readonly YouTrackStateField[] {
  if (fields?.some((candidate) => candidate.id === field.id)) return fields;
  return [...(fields ?? []), field];
}

export function mergeProjects(
  first: readonly YouTrackProject[],
  second: readonly YouTrackProject[],
): YouTrackProject[] {
  const merged = new Map(second.map((project) => [project.id, project]));
  for (const project of first) {
    const previous = merged.get(project.id);
    merged.set(project.id, {
      ...previous, ...project,
      stateFields: project.stateFields?.length ? project.stateFields : previous?.stateFields,
    });
  }
  return [...merged.values()];
}

export async function discoverProjectDetails(
  http: DiscoveryClient,
  workspaceId: string,
  baseUrl: string,
  projectIds: readonly string[],
  apiToken: string,
  signal?: AbortSignal,
): Promise<YouTrackProject[]> {
  const chunks = chunk(projectIds, 20);
  const results = await Promise.all(chunks.map((ids) => discoverYouTrack(http, workspaceId, {
    baseUrl, ...(apiToken ? { apiToken } : {}), projectIds: ids,
  }, signal)));
  return results.flatMap((result) => result.projects);
}

function chunk(values: readonly string[], size: number): string[][] {
  const result: string[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

export function reconcileDraftProjects(
  draft: YouTrackConfigurationDraft,
  catalog: readonly YouTrackProject[],
  details: readonly YouTrackProject[],
): YouTrackConfigurationDraft {
  const known = new Map(catalog.map((project) => [project.id, project]));
  const detailed = new Map(details.map((project) => [project.id, project]));
  return {
    ...draft,
    routes: draft.routes.map((route) => {
      if (!route.project.id) return route;
      const project = detailed.get(route.project.id) ?? known.get(route.project.id);
      return project ? routeWithProject(route, project) : clearRouteProject(route);
    }),
  };
}

export function routeWithProject(route: YouTrackRouteDraft, project: YouTrackProject): YouTrackRouteDraft {
  const fields = project.stateFields ?? [];
  const selectedField = fields.find((field) => field.id === route.workflow.stateField.id)
    ?? (fields.length === 1 ? fields[0] : undefined);
  const statuses = selectedField?.statuses ?? [];
  const available = new Set(statuses.map((status) => status.id));
  const keep = (values: readonly string[]) => values.filter((value) => available.has(value));
  const keepOne = (value: string | null) => value && available.has(value) ? value : null;
  return {
    ...route,
    project: { id: project.id, name: project.name, shortName: project.shortName },
    workflow: {
      stateField: selectedField ? { id: selectedField.id, name: selectedField.name } : { id: "", name: "" },
      statuses: [...statuses],
      inbound: {
        backlog: keep(route.workflow.inbound.backlog), inProgress: keep(route.workflow.inbound.inProgress),
        readyForRetest: keep(route.workflow.inbound.readyForRetest), accepted: keep(route.workflow.inbound.accepted),
      },
      outbound: {
        open: keepOne(route.workflow.outbound.open), triaged: keepOne(route.workflow.outbound.triaged),
        inProgress: keepOne(route.workflow.outbound.inProgress),
        readyForRetest: keepOne(route.workflow.outbound.readyForRetest),
        verified: keepOne(route.workflow.outbound.verified), closed: keepOne(route.workflow.outbound.closed),
        reopened: keepOne(route.workflow.outbound.reopened),
      },
    },
  };
}

function clearRouteProject(route: YouTrackRouteDraft): YouTrackRouteDraft {
  return routeWithProject(route, { id: "", name: "", shortName: "", stateFields: [] });
}

export function uniqueProjectIds(routes: readonly YouTrackRouteDraft[]): string[] {
  return [...new Set(routes.map((route) => route.project.id).filter(Boolean))];
}

export function validationKey(
  issue: YouTrackDraftIssue | null,
): keyof HooksCopy["validation"] {
  const keys: Record<Exclude<typeof issue, null>, keyof HooksCopy["validation"]> = {
    base_url: "baseUrl", token: "token", default_project: "defaultProject",
    route_match: "routeMatch", route_duplicate: "routeDuplicate", state_field: "stateField",
    ready_statuses: "readyStatuses", accepted_statuses: "acceptedStatuses",
    status_conflict: "statusConflict", status_unavailable: "statusUnavailable",
    outbound_status: "outboundStatus",
  };
  return issue ? keys[issue] : "connection";
}

export function discoveryError(copy: HooksCopy, error: unknown): string {
  const code = apiError(error)?.code;
  if (code === "CREDENTIALS_REQUIRED") return copy.validation.token;
  if (code === "DISCOVERY_NOT_SUPPORTED") return copy.discoveryUnsupported;
  return copy.connectionFailure;
}

export function saveError(copy: HooksCopy, error: unknown): string {
  const code = apiError(error)?.code;
  if (code === "TARGET_PROJECT_NOT_ACCESSIBLE") return copy.validation.defaultProject;
  if (code === "STATE_FIELD_NOT_ACCESSIBLE") return copy.validation.stateField;
  if (code === "STATUS_NOT_ACCESSIBLE") return copy.validation.statusUnavailable;
  if (code === "CREDENTIALS_REQUIRED") return copy.validation.token;
  if (code === "CONFIGURATION_IN_USE") return copy.validation.disconnectFirst;
  if (code === "RECONFIGURATION_BUSY") return copy.disconnectBusy;
  return copy.saveFailure;
}

export function isStaleWrite(error: unknown): boolean {
  return apiError(error)?.status === 412;
}

function apiError(error: unknown): ApiErrorShape | null {
  return typeof error === "object" && error !== null ? error as ApiErrorShape : null;
}
