import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
export async function listWorkspaceActors(http: TmsHttpClient, workspaceId: string, options: {
    search?: string;
    cursor?: string | null;
    identityId?: string;
    eligible?: boolean;
}, signal?: AbortSignal) {
    const query = new URLSearchParams({ limit: "100" });
    if (options.search?.trim())
        query.set("search", options.search.trim().slice(0, 120));
    if (options.cursor)
        query.set("cursor", options.cursor);
    if (options.identityId)
        query.set("identityId", options.identityId);
    if (options.eligible)
        query.set("eligible", "true");
    const page = await http.get<components["schemas"]["ActorCatalogEnvelope"]>(`/workspaces/${encodeURIComponent(workspaceId)}/actors?${query}`, signal);
    const items: WorkspaceActor[] = page.data.map(actor => actor.kind === "human"
        ? { identityId: actor.identityId, kind: "human", name: actor.name, email: actor.email }
        : { identityId: actor.identityId, kind: "agent", provider: actor.provider, name: actor.name, status: actor.status });
    return { items, nextCursor: page.meta.hasMore ? page.meta.nextCursor : null };
}
