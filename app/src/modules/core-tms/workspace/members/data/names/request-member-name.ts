import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { requestWorkspaceActor } from "../actors/request-workspace-actor";
export async function requestMemberName(http: TmsHttpClient, workspaceId: string, identityId: string, signal: AbortSignal): Promise<string | null> {
  return (await requestWorkspaceActor(http, workspaceId, identityId, signal))?.name ?? null;
}
