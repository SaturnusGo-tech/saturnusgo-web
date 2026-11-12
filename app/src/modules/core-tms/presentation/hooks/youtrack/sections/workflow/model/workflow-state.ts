import type { YouTrackInboundWorkflow, YouTrackRouteDraft, YouTrackStateField } from "../../../../../../youtrack/model/youtrack-settings";
type InboundKey = keyof YouTrackInboundWorkflow;
type OutboundKey = keyof YouTrackRouteDraft["workflow"]["outbound"];

export function updateInbound(route: YouTrackRouteDraft, key: InboundKey, values: string[]): YouTrackRouteDraft {
  const chosen = new Set(values);
  const inbound = Object.fromEntries((Object.keys(route.workflow.inbound) as InboundKey[]).map((candidate) => [
    candidate, candidate === key ? [...chosen] : route.workflow.inbound[candidate].filter((id) => !chosen.has(id)),
  ])) as YouTrackRouteDraft["workflow"]["inbound"];
  const mapped = new Set(Object.values(inbound).flat());
  const outbound = Object.fromEntries((Object.keys(route.workflow.outbound) as OutboundKey[]).map((candidate) => {
    const value = route.workflow.outbound[candidate];
    const valid = value && mapped.has(value) && (candidate !== "verified" || inbound.accepted.includes(value));
    return [candidate, valid ? value : null];
  })) as YouTrackRouteDraft["workflow"]["outbound"];
  return { ...route, workflow: { ...route.workflow, inbound, outbound } };
}

export function routeWithStateField(route: YouTrackRouteDraft, field: YouTrackStateField): YouTrackRouteDraft {
  return { ...route, workflow: { stateField: { id: field.id, name: field.name }, statuses: [...field.statuses],
    inbound: { backlog: [], inProgress: [], readyForRetest: [], accepted: [] },
    outbound: { open: null, triaged: null, inProgress: null, readyForRetest: null,
      verified: null, closed: null, reopened: null },
  } };
}
