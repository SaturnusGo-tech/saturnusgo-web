import type { YouTrackProject, YouTrackRouteDraft } from "../../../../../youtrack/model/youtrack-settings";

type Workflow = YouTrackRouteDraft["workflow"];

/** Translate only the server's version-1 references; stage membership remains server-owned. */
export function reconcileLegacyWorkflow(
  route: YouTrackRouteDraft,
  project: YouTrackProject,
  configurationVersion: number,
): YouTrackRouteDraft | null {
  if (configurationVersion !== 1 || !route.legacyKey || route.workflow.stateField.id) return route;
  if (route.project.id !== project.id || project.stateFields?.length !== 1) return null;

  const field = project.stateFields[0];
  const references = new Set([
    ...Object.values(route.workflow.inbound).flat(),
    ...Object.values(route.workflow.outbound).filter((value): value is string => value !== null),
  ]);
  const translated = new Map<string, string>();
  for (const reference of references) {
    const source = route.workflow.statuses.filter(status => status.id === reference);
    if (source.length !== 1) return null;
    const matches = field.statuses.filter(status => !status.archived && status.name === source[0].name);
    if (matches.length !== 1) return null;
    translated.set(reference, matches[0].id);
  }
  if (new Set(translated.values()).size !== translated.size) return null;

  const inbound = Object.fromEntries(
    Object.entries(route.workflow.inbound).map(([key, values]) => [
      key, values.map(value => translated.get(value)!),
    ]),
  ) as Workflow["inbound"];
  const outbound = Object.fromEntries(
    Object.entries(route.workflow.outbound).map(([key, value]) => [
      key, value === null ? null : translated.get(value)!,
    ]),
  ) as Workflow["outbound"];

  return {
    ...route,
    workflow: {
      stateField: { id: field.id, name: field.name },
      statuses: [...field.statuses],
      inbound,
      outbound,
    },
  };
}
