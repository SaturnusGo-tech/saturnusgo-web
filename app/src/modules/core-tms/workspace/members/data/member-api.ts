import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { WorkspaceMember } from "../model/member";

export async function listWorkspaceMembers(http: TmsHttpClient, workspaceId: string, search: string, cursor: string | null, signal?: AbortSignal, identityId?: string) {
  const query = new URLSearchParams({ limit: "100" });
  if (search.trim()) query.set("search", search.trim().slice(0, 120));
  if (cursor) query.set("cursor", cursor);
  if (identityId) query.set("identityId", identityId);
  const result = await http.get<components["schemas"]["WorkspaceMemberDirectoryEnvelope"]>(`/workspaces/${encodeURIComponent(workspaceId)}/members?${query}`, signal);
  const items: WorkspaceMember[] = result.data.map((member) => ({ id: member.identityId, name: member.displayName, email: member.email }));
  return { items, nextCursor: result.meta.hasMore ? result.meta.nextCursor : null };
}
