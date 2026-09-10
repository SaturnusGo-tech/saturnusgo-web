import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { ManagedAvatarGrant } from "../../../auth/managed/domain/managed-avatar";
export async function getMemberAvatar(http: TmsHttpClient, identityId: string, signal: AbortSignal): Promise<ManagedAvatarGrant> {
  return (await http.getResource<ManagedAvatarGrant>(`/company/members/${encodeURIComponent(identityId)}/avatar`, signal)).data;
}
