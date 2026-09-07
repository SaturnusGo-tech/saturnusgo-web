import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { components } from "../../../../../core/tms/generated/tms-api";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { impactApi } from "../../data/impact-api";
import type { ImpactScope } from "../../model/impact-types";
import { impactError } from "../shared/impact-error";
export function useImpactHistory(scope: ImpactScope, id: string, version: number, ru: boolean) {
  const http = useTmsHttpClient(); const api = useMemo(() => impactApi(http), [http]);
  const session = useTmsSession();
  const [items, setItems] = useState<components["schemas"]["ActivityEvent"][]>([]);
  const [next, setNext] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); const request = useRef<AbortController | null>(null);
  const owner = JSON.stringify([session.subject, scope.workspaceId, scope.projectId, id, version]); const current = useRef(owner); current.current = owner;
  const load = useCallback(async (cursor?: string) => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller; setLoading(true); setError(null);
    try { const result = await api.history(scope, id, controller.signal, cursor);
      if (controller.signal.aborted || current.current !== owner) return;
      if (result.data.some((row) => row.workspaceId !== scope.workspaceId || row.projectId !== scope.projectId || row.entityId !== id)) throw new Error("IMPACT_SCOPE_MISMATCH");
      setItems((old) => cursor ? [...old, ...result.data.filter((item) => !old.some((row) => row.id === item.id))] : result.data); setNext(result.meta.nextCursor);
    } catch (cause) { if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru)); }
    finally { if (!controller.signal.aborted && current.current === owner) setLoading(false); }
  }, [api, scope.workspaceId, scope.projectId, id, owner, ru]);
  useEffect(() => { setItems([]); setNext(null); void load(); return () => request.current?.abort(); }, [load]);
  return { items, next, error, loading, more: () => load(next ?? undefined) };
}
