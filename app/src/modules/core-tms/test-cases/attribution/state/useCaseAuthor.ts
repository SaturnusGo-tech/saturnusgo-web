import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getCaseRevision } from "../../data/test-case-api";
export function useCaseAuthor(caseId: string, workspaceId: string, offline: boolean) {
  const http = useTmsHttpClient();
  const scope = `${workspaceId}:${caseId}`;
  const [state, setState] = useState({ scope, author: null as string | null, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ scope, author: null, loading: !offline });
    if (!offline) void getCaseRevision(http, caseId, 1, controller.signal)
      .then((revision) => { if (!controller.signal.aborted) setState({ scope, author: revision.createdBy ?? null, loading: false }); })
      .catch(() => { if (!controller.signal.aborted) setState({ scope, author: null, loading: false }); });
    return () => controller.abort();
  }, [http, caseId, workspaceId, offline]);
  return state.scope === scope ? state : { scope, author: null, loading: !offline };
}
