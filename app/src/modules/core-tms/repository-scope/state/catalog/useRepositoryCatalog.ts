import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import type { Portfolio } from "../../../portfolios/model/portfolio";
import { loadRepositoryPortfolios } from "../../data/repository-catalog";

export function useRepositoryCatalog(workspaceId: string, enabled: boolean) {
  const http = useTmsHttpClient();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ scope: string; items: Portfolio[]; loading: boolean; error: boolean }>({ scope: "", items: [], loading: true, error: false });
  useEffect(() => {
    if (!enabled || !workspaceId) return;
    const controller = new AbortController();
    setState({ scope: workspaceId, items: [], loading: true, error: false });
    void loadRepositoryPortfolios(http, workspaceId, controller.signal).then(items => {
      if (!controller.signal.aborted) setState({ scope: workspaceId, items, loading: false, error: false });
    }, () => { if (!controller.signal.aborted) setState({ scope: workspaceId, items: [], loading: false, error: true }); });
    return () => controller.abort();
  }, [http, workspaceId, enabled, revision]);
  const visible = state.scope === workspaceId ? state : { items: [], loading: enabled, error: false };
  return { ...visible, retry: () => setRevision(value => value + 1) };
}
