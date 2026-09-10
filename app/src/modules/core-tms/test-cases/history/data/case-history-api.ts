import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { Activity } from "../../../../../core/tms/contracts/legacy-contract";
export async function listCaseHistory(http: TmsHttpClient, workspaceId: string, projectId: string,
  caseId: string, cursor: string | null, signal: AbortSignal) {
  const query = new URLSearchParams({ workspaceId, projectId, entityType: "test_case", entityId: caseId, limit: "50" });
  if (cursor) query.set("cursor", cursor);
  const page = await http.get<components["schemas"]["ActivityListEnvelope"]>(`/activity?${query}`, signal);
  const items: Activity[] = page.data.map(entry => {
    if (entry.workspaceId !== workspaceId || entry.projectId !== projectId || entry.entityId !== caseId || entry.entityType !== "test_case") throw new Error("Invalid case activity scope");
    return { id: entry.id, actor: entry.actor, actorIdentityId: entry.actorIdentityId ?? null,
      action: entry.action, entityKey: entry.entityKey, createdAt: entry.createdAt };
  });
  if (page.meta.hasMore && (!page.meta.nextCursor || page.meta.nextCursor === cursor)) throw new Error("Invalid activity cursor");
  return { items, nextCursor: page.meta.hasMore ? page.meta.nextCursor : null };
}
