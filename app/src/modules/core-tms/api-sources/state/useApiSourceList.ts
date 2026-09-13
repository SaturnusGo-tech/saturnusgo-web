import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { listApiSources } from "../data/api-source-api";
import type { ApiContext, ApiSource } from "../model/api-source";
import { apiContextKey } from "../scope/api-context";
export function useApiSourceList(workspaceId: string, context: ApiContext, catalog = false, active = true) {
  const http = useTmsHttpClient(); const key = `${workspaceId}:${catalog ? "catalog" : apiContextKey(context)}`;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; items: ApiSource[]; loading: boolean; error: unknown }>({ key: "", items: [], loading: true, error: null });
  useEffect(() => {
    if (!active) return;
    if (!catalog && !context.portfolioId && !context.projectIds?.length) {
      setState({ key, items: [], loading: false, error: null }); return;
    }
    const controller = new AbortController();
    setState(current => ({ key, items: current.key === key ? current.items : [], loading: true, error: null }));
    void listApiSources(http, workspaceId, context, catalog, controller.signal).then(items => {
      if (!controller.signal.aborted) setState({ key, items, loading: false, error: null });
    }).catch(error => { if (!controller.signal.aborted) setState({ key, items: [], loading: false, error }); });
    return () => controller.abort();
  }, [http, key, revision, active]);
  return { ...(state.key === key ? state : { items: [], loading: true, error: null }),
    refresh: () => setRevision(value => value + 1) };
}
