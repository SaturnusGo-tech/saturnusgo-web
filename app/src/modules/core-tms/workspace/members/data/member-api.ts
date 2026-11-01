import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { WorkspaceMember } from "../model/member";
import { listWorkspaceActors } from "./actors/actor-api";
export async function listWorkspaceMembers(http: TmsHttpClient, workspaceId: string, search: string, cursor: string | null, signal?: AbortSignal, identityId?: string) {
  const page = await listWorkspaceActors(http, workspaceId, { search, cursor, identityId, eligible: true }, signal);
  const items: WorkspaceMember[] = page.items.map(actor => actor.kind === "human"
    ? { id: actor.identityId, kind: "human", name: actor.name, email: actor.email }
    : { id: actor.identityId, kind: "agent", provider: actor.provider, status: actor.status, name: actor.name });
  return { items, nextCursor: page.nextCursor };
}
