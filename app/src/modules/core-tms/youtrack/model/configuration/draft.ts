import type {
  YouTrackConfiguration,
  YouTrackConfigurationDraft,
  YouTrackConfigurationInput,
  YouTrackDraftIssue,
  YouTrackLegacyTargetKey,
  YouTrackRoute,
  YouTrackRouteDraft,
  YouTrackStatus,
} from "./types";

export function draftFromConfiguration(configuration: YouTrackConfiguration): YouTrackConfigurationDraft {
  const configured = configuration.routes?.length
    ? configuration.routes.map(mutableRoute)
    : legacyRoutes(configuration);
  const routes = configuration.configurationVersion === 2
    ? ensureOneDefault(configured.length ? configured : [createEmptyRoute("default", true)])
    : legacyUpgradeDraft(configured);
  return {
    enabled: configuration.enabled,
    baseUrl: configuration.baseUrl ?? "",
    apiToken: "",
    routes,
  };
}

export function createEmptyRoute(id: string, isDefault = false): YouTrackRouteDraft {
  return {
    id, name: isDefault ? "Default" : "Rule", enabled: true, isDefault,
    match: isDefault ? null : { field: "component", value: "" },
    project: { id: "", name: "", shortName: "" },
    workflow: emptyWorkflow(),
  };
}

export function validateYouTrackDraft(
  draft: YouTrackConfigurationDraft,
  reusableTokenConfigured: boolean,
): YouTrackDraftIssue | null {
  try { normalizeYouTrackBaseUrl(draft.baseUrl); } catch { return "base_url"; }
  const apiToken = draft.apiToken.trim();
  if ((!reusableTokenConfigured && apiToken.length === 0) ||
    (apiToken.length > 0 && (apiToken.length < 32 || new TextEncoder().encode(apiToken).length > 2048))) {
    return "token";
  }
  const active = draft.routes.filter((route) => route.enabled);
  if (active.filter((route) => route.isDefault).length !== 1 ||
    !active.find((route) => route.isDefault)?.project.id.trim()) return "default_project";
  const matcherKeys = new Set<string>();
  for (const route of draft.routes) {
    const issue = validateRoute(route, matcherKeys);
    if (issue) return issue;
  }
  return null;
}

function validateRoute(route: YouTrackRouteDraft, matcherKeys: Set<string>): YouTrackDraftIssue | null {
  if (!route.project.id.trim()) return "default_project";
  if (!route.isDefault) {
    const value = route.match?.value.trim();
    if (!route.match || !value) return "route_match";
    const key = `${route.match.field}:${value.toLocaleLowerCase()}`;
    if (matcherKeys.has(key)) return "route_duplicate";
    matcherKeys.add(key);
  }
  if (!route.workflow.stateField.id.trim()) return "state_field";
  if (route.workflow.inbound.readyForRetest.length === 0) return "ready_statuses";
  if (route.workflow.inbound.accepted.length === 0) return "accepted_statuses";
  const known = new Set(route.workflow.statuses.filter((status) => !status.archived).map((status) => status.id));
  const grouped = Object.values(route.workflow.inbound).flat();
  if (grouped.some((id) => !known.has(id))) return "status_unavailable";
  if (new Set(grouped).size !== grouped.length) return "status_conflict";
  const outbound = Object.values(route.workflow.outbound).filter((id): id is string => Boolean(id));
  if (outbound.some((id) => !grouped.includes(id)) ||
    (route.workflow.outbound.verified &&
      !route.workflow.inbound.accepted.includes(route.workflow.outbound.verified))) return "outbound_status";
  return null;
}

export function configurationInput(draft: YouTrackConfigurationDraft): YouTrackConfigurationInput {
  const apiToken = draft.apiToken.trim();
  return {
    configurationVersion: 2,
    enabled: draft.enabled,
    baseUrl: normalizeYouTrackBaseUrl(draft.baseUrl),
    ...(apiToken ? { apiToken } : {}),
    routes: ensureOneDefault(draft.routes).map((route) => ({
      ...route,
      name: route.name.trim() || (route.isDefault ? "Default" : "Rule"),
      ...(route.legacyKey ? { legacyKey: route.legacyKey } : {}),
      match: route.isDefault || !route.match ? null : {
        field: route.match.field, value: route.match.value.trim(),
      },
      project: {
        id: route.project.id.trim(), name: route.project.name.trim(), shortName: route.project.shortName.trim(),
      },
      workflow: {
        stateField: { ...route.workflow.stateField },
        inbound: {
          backlog: unique(route.workflow.inbound.backlog),
          inProgress: unique(route.workflow.inbound.inProgress),
          readyForRetest: unique(route.workflow.inbound.readyForRetest),
          accepted: unique(route.workflow.inbound.accepted),
        },
        outbound: { ...route.workflow.outbound },
      },
    })),
  };
}

export function normalizeYouTrackBaseUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
    url.toString().length > 2048) throw new TypeError("YouTrack base URL must be an HTTPS service URL.");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url.toString();
}

export function canReuseYouTrackToken(
  configuration: Pick<YouTrackConfiguration, "baseUrl" | "tokenConfigured">,
  draftBaseUrl: string,
): boolean {
  if (!configuration.tokenConfigured || configuration.baseUrl === null) return false;
  try {
    return normalizeYouTrackBaseUrl(draftBaseUrl) === normalizeYouTrackBaseUrl(configuration.baseUrl);
  } catch { return false; }
}

export function statusLabel(status: YouTrackStatus): string {
  return status.localizedName?.trim() || status.name;
}

function mutableRoute(route: YouTrackRoute): YouTrackRouteDraft {
  return {
    ...route,
    match: route.match ? { ...route.match } : null,
    project: { ...route.project },
    workflow: {
      stateField: route.workflow.stateField ? { ...route.workflow.stateField } : { id: "", name: "" },
      statuses: route.workflow.statuses.map((status) => ({ ...status })),
      inbound: {
        backlog: [...route.workflow.inbound.backlog], inProgress: [...route.workflow.inbound.inProgress],
        readyForRetest: [...route.workflow.inbound.readyForRetest], accepted: [...route.workflow.inbound.accepted],
      },
      outbound: { ...route.workflow.outbound },
    },
  };
}

function emptyWorkflow(): YouTrackRouteDraft["workflow"] {
  return {
    stateField: { id: "", name: "" }, statuses: [],
    inbound: { backlog: [], inProgress: [], readyForRetest: [], accepted: [] },
    outbound: {
      open: null, triaged: null, inProgress: null, readyForRetest: null,
      verified: null, closed: null, reopened: null,
    },
  };
}

function legacyRoutes(configuration: YouTrackConfiguration): YouTrackRouteDraft[] {
  const entries = (Object.entries(configuration.targets ?? {}) as
    [YouTrackLegacyTargetKey, { projectId: string; shortName: string } | null][]) 
    .filter((entry): entry is [YouTrackLegacyTargetKey, NonNullable<typeof entry[1]>] => Boolean(entry[1]));
  return entries.map(([key, project]) => {
    const route = createEmptyRoute(key);
    route.name = project.shortName;
    route.legacyKey = key;
    route.project = { id: project.projectId, shortName: project.shortName, name: project.shortName };
    route.match = { field: "tag", value: key };
    return route;
  });
}

function legacyUpgradeDraft(routes: YouTrackRouteDraft[]): YouTrackRouteDraft[] {
  const rules = routes.map((route) => ({
    ...route,
    isDefault: false,
    match: route.legacyKey ? { field: "tag" as const, value: route.legacyKey }
      : route.match ?? { field: "component" as const, value: "" },
  }));
  return [createEmptyRoute("default", true), ...rules];
}

function ensureOneDefault(routes: YouTrackRouteDraft[]): YouTrackRouteDraft[] {
  const explicit = routes.findIndex((route) => route.isDefault && route.enabled);
  const defaultIndex = explicit >= 0 ? explicit : routes.findIndex((route) => route.enabled);
  return routes.map((route, index) => ({
    ...route, isDefault: index === defaultIndex,
    match: index === defaultIndex ? null : route.match ?? { field: "component", value: "" },
  }));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
