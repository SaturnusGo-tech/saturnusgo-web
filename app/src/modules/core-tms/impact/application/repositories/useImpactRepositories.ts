import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { impactApi } from "../../data/impact-api";
import type { ImpactRepository, ImpactScope, RepositoryInput } from "../../model/impact-types";
import { impactError } from "../shared/impact-error";
export function useImpactRepositories(scope: ImpactScope, ru: boolean, writable: boolean) {
  const http = useTmsHttpClient(); const api = useMemo(() => impactApi(http), [http]);
  const session = useTmsSession();
  const [rows, setRows] = useState<ImpactRepository[]>([]); const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false); const [loaded, setLoaded] = useState(false);
  const request = useRef<AbortController | null>(null);
  const owner = JSON.stringify([session.subject, scope.workspaceId, scope.projectId, writable]); const current = useRef(owner); current.current = owner;
  const validate = (items: ImpactRepository[]) => {
    if (items.some((item) => item.workspaceId !== scope.workspaceId || item.projectId !== scope.projectId)) throw new Error("IMPACT_SCOPE_MISMATCH");
    return items;
  };
  const load = useCallback(async () => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller; setPending(true); setError(null);
    try { const data = await api.repositories(scope, controller.signal);
      if (!controller.signal.aborted && current.current === owner) { setRows(validate(data)); setLoaded(true); }
    } catch (cause) { if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru)); }
    finally { if (!controller.signal.aborted && current.current === owner) { setPending(false); request.current = null; } }
  }, [api, owner, scope.workspaceId, scope.projectId, ru]);
  useEffect(() => { setRows([]); setLoaded(false); void load(); return () => request.current?.abort(); }, [load]);
  const save = async (id: string, version: number, input: RepositoryInput) => {
    if (!writable || request.current || !loaded) return false;
    const controller = new AbortController(); request.current = controller; setPending(true); setError(null);
    try {
      const result = await api.saveRepository(scope, id, input, { ifMatch: `"impact-repository:${id}:v${version}"`, signal: controller.signal });
      if (controller.signal.aborted || current.current !== owner) return false;
      validate([result.data]); setRows((old) => [...old.filter((row) => row.id !== id), result.data]); return true;
    } catch (cause) { if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru)); return false; }
    finally { if (request.current === controller) request.current = null; if (current.current === owner) setPending(false); }
  };
  return { rows, error, pending, loaded, refresh: load, save };
}
