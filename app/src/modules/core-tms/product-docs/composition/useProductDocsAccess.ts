import { useEffect, useMemo, useState } from "react";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { ProductDocScope } from "../domain/product-docs";
import { createProductDocsApi } from "../data/product-docs-api";

export function useProductDocsAccess(workspaceId: string, projectId: string, connected: boolean) {
  const http = useOptionalTmsHttpClient();
  const api = useMemo(() => http ? createProductDocsApi(http) : null, [http]);
  const scope = useMemo<ProductDocScope>(() => ({workspaceId, projectId}), [workspaceId, projectId]);
  const [state, setState] = useState<{scope: ProductDocScope; enabled: boolean}>();
  const eligible = Boolean(api && connected && workspaceId && projectId);
  useEffect(() => {
    if (!api || !eligible) return;
    const request = new AbortController();
    api.availability(scope, request.signal).then(
      enabled => { if (!request.signal.aborted) setState({scope, enabled}); },
      () => { if (!request.signal.aborted) setState({scope, enabled: false}); },
    );
    return () => request.abort();
  }, [api, scope, eligible]);

  return {
    api, scope,
    enabled: eligible && state?.scope === scope && state.enabled,
    pending: eligible && state?.scope !== scope,
  };
}
