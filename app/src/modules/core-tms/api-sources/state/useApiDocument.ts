import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { SwaggerSpecification } from "../../connectors/model/swagger/swagger-specification";
import type { ApiContext, ApiSource } from "../model/api-source";
import { readApiSpecification } from "../data/api-source-api";
import { apiContextKey } from "../scope/api-context";
export function useApiDocument(workspaceId: string, context: ApiContext, source: ApiSource | null) {
  const http = useTmsHttpClient(); const [revision, setRevision] = useState(0);
  const key = `${workspaceId}:${apiContextKey(context)}:${source?.id}:${source?.rowVersion}:${source?.enabled}:${revision}`;
  const [state, setState] = useState<{ key: string; loading: boolean; document: SwaggerSpecification | null; error: unknown }>({ key: "", loading: false, document: null, error: null });
  useEffect(() => {
    if (!source?.enabled) return;
    const controller = new AbortController(); setState({ key, loading: true, document: null, error: null });
    void readApiSpecification(http, workspaceId, source.id, context, controller.signal).then(document => {
      if (!controller.signal.aborted) setState({ key, loading: false, document, error: null });
    }).catch(error => { if (!controller.signal.aborted) setState({ key, loading: false, document: null, error }); });
    return () => controller.abort();
  }, [http, key]);
  return { ...(state.key === key ? state : { loading: Boolean(source?.enabled), document: null, error: null }),
    reload: () => setRevision(value => value + 1) };
}
