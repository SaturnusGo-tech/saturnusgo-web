import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { impactApi } from "../../data/impact-api";
import type { ImpactAnalysis, ImpactScope } from "../../model/impact-types";
import { impactError } from "../shared/impact-error";
export function useImpactList(scope: ImpactScope, enabled: boolean, ru: boolean, runId?: string) {
  const http = useTmsHttpClient(); const api = useMemo(() => impactApi(http), [http]);
  const session = useTmsSession();
  const owner = JSON.stringify([session.subject, scope.workspaceId, scope.projectId, enabled, runId]);
  const current = useRef(owner); current.current = owner;
  const request = useRef<AbortController | null>(null);
  const [items, setItems] = useState<ImpactAnalysis[]>([]); const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const [resolvedOwner, setResolvedOwner] = useState("");
  const load = useCallback(async (before?: string) => {
    request.current?.abort(); if (!enabled) return;
    const controller = new AbortController(); request.current = controller; setLoading(true); setError(null);
    try {
      const result = await api.list(scope, controller.signal, before, runId);
      if (controller.signal.aborted || current.current !== owner) return;
      if (result.data.some((item) => item.workspaceId !== scope.workspaceId || item.projectId !== scope.projectId
        || (runId && item.runId !== runId))) throw new Error("IMPACT_SCOPE_MISMATCH");
      setItems((old) => before ? [...old, ...result.data.filter((item) => !old.some((row) => row.id === item.id))] : result.data);
      setNext(result.nextCursor); setResolvedOwner(owner);
    } catch (cause) { if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru)); }
    finally { if (!controller.signal.aborted && current.current === owner) setLoading(false); }
  }, [api, owner, enabled, ru, scope.workspaceId, scope.projectId, runId]);
  useEffect(() => { setItems([]); setNext(null); setResolvedOwner(""); void load(); return () => request.current?.abort(); }, [load]);
  return { items: resolvedOwner === owner ? items : [], loading, error, next,
    ready: resolvedOwner === owner, refresh: () => load(), more: () => next ? load(next) : Promise.resolve() };
}
