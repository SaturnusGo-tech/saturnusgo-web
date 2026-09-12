import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { loadPortfolioRepository, type PortfolioCatalog, type RepositoryProject } from "../data/repository-content";

type State = { scope: string; catalog: PortfolioCatalog | null; branches: ReadonlyMap<string, RepositoryProject | null>; loading: boolean; error: boolean };
export function usePortfolioRepository(workspaceId: string, portfolioId: string | null, enabled: boolean) {
  const http = useTmsHttpClient();
  const scope = `${workspaceId}:${portfolioId}`;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<State>({ scope: "", catalog: null, branches: new Map(), loading: true, error: false });
  useEffect(() => {
    if (!enabled || !portfolioId) return;
    const controller = new AbortController();
    setState({ scope, catalog: null, branches: new Map(), loading: true, error: false });
    void loadPortfolioRepository(http, workspaceId, portfolioId, controller.signal,
      catalog => { if (!controller.signal.aborted) setState(current => ({ ...current, catalog })); },
      (id, content) => { if (!controller.signal.aborted) setState(current => ({ ...current, branches: new Map(current.branches).set(id, content) })); },
    ).then(() => { if (!controller.signal.aborted) setState(current => ({ ...current, loading: false })); },
      () => { if (!controller.signal.aborted) setState({ scope, catalog: null, branches: new Map(), loading: false, error: true }); });
    return () => controller.abort();
  }, [http, workspaceId, portfolioId, enabled, revision]);
  return { ...(state.scope === scope ? state : { catalog: null, branches: new Map<string, RepositoryProject | null>(), loading: enabled, error: false }),
    retry: () => setRevision(value => value + 1) };
}
