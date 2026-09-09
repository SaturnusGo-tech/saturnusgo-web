import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { DiscussionScope, OrganizationComment } from "../model/discussion";

type Api = components["schemas"];
const path = (scope: DiscussionScope) => `/${scope.targetType === "project" ? "projects" : "portfolios"}/${encodeURIComponent(scope.targetId)}/comments`;
const mapComment = (item: Api["OrganizationComment"]): OrganizationComment => ({
  id: item.id, body: item.body, author: { identityId: item.author.identityId, displayName: item.author.displayName }, createdAt: item.createdAt,
});

export async function listDiscussion(http: TmsHttpClient, scope: DiscussionScope, cursor: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ workspaceId: scope.workspaceId, limit: "30" });
  if (cursor) query.set("cursor", cursor);
  const result = await http.get<Api["OrganizationCommentListEnvelope"]>(`${path(scope)}?${query}`, signal);
  return { items: result.data.map(mapComment), nextCursor: result.meta.hasMore ? result.meta.nextCursor : null };
}

export async function postDiscussion(http: TmsHttpClient, scope: DiscussionScope, body: string, key: string, signal?: AbortSignal) {
  const result = await http.mutateResource<Api["OrganizationComment"]>(path(scope), "POST",
    { workspaceId: scope.workspaceId, body: body.trim() } satisfies Api["OrganizationCommentCreateRequest"], { idempotencyKey: key, signal });
  return mapComment(result.data);
}
