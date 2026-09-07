import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { components } from "../../../../../core/tms/generated/tms-api";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { impactApi } from "../../data/impact-api";
import type { ImpactScope } from "../../model/impact-types";
import { impactError } from "../shared/impact-error";
export function useImpactCases(scope: ImpactScope, ru: boolean) {
  const http = useTmsHttpClient(); const api = useMemo(() => impactApi(http), [http]);
  const session = useTmsSession();
  const [query, setQuery] = useState(""); const [items, setItems] = useState<components["schemas"]["TestCaseSummary"][]>([]);
  const [next, setNext] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); const request = useRef<AbortController | null>(null);
  const owner = JSON.stringify([session.subject, scope.workspaceId, scope.projectId, query]); const current = useRef(owner); current.current = owner;
  const load = useCallback(async (cursor?: string) => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(null);
    try {
      const result = await api.cases(scope, query, controller.signal, cursor);
      if (controller.signal.aborted || current.current !== owner) return;
      if (result.data.some((item) => item.projectId !== scope.projectId)) throw new Error("IMPACT_SCOPE_MISMATCH");
      setItems((old) => cursor ? [...old, ...result.data.filter((item) => !old.some((row) => row.id === item.id))] : result.data);
      setNext(result.meta.nextCursor);
    } catch (cause) { if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru)); }
    finally { if (!controller.signal.aborted && current.current === owner) setLoading(false); }
  }, [api, scope.workspaceId, scope.projectId, query, ru, owner]);
  useEffect(() => { setItems([]); setNext(null); const timer = setTimeout(() => void load(), 250);
    return () => { clearTimeout(timer); request.current?.abort(); }; }, [load]);
  return { items, query, setQuery, loading, error, next, more: () => next ? load(next) : load() };
}
