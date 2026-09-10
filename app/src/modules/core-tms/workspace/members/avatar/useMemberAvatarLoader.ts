import { useCallback } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getMemberAvatar } from "../data/member-avatar-api";
export function useMemberAvatarLoader(identityId: string | null) {
  const http = useTmsHttpClient();
  return useCallback((signal: AbortSignal) => identityId ? getMemberAvatar(http, identityId, signal) : Promise.resolve(null), [http, identityId]);
}
