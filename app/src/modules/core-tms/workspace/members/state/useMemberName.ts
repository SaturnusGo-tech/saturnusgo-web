import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { requestMemberName } from "../data/names/request-member-name";

export function useMemberName(workspaceId: string, identityId: string | null, offline: boolean) {
  const http = useTmsHttpClient();
  const scope = `${workspaceId}:${identityId ?? ""}`;
  const [state, setState] = useState<{ scope: string; name: string | null; loading: boolean }>({ scope, name: null, loading: Boolean(identityId) && !offline });
  useEffect(() => {
    const controller = new AbortController();
    setState({ scope, name: null, loading: Boolean(identityId) && !offline });
    if (identityId && !offline) void requestMemberName(http, workspaceId, identityId, controller.signal)
      .then((name) => { if (!controller.signal.aborted) setState({ scope, name, loading: false }); })
      .catch(() => { if (!controller.signal.aborted) setState({ scope, name: null, loading: false }); });
    return () => controller.abort();
  }, [http, workspaceId, identityId, offline]);
  return state.scope === scope ? state : { scope, name: null, loading: Boolean(identityId) && !offline };
}
