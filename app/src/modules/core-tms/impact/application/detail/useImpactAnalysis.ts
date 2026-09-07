import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TmsResource } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { impactApi } from "../../data/impact-api";
import type { ImpactAnalysis, ImpactCommand, ImpactPermissions, ImpactScope } from "../../model/impact-types";
import { impactCommandAllowed } from "../../model/impact-types";
import { ImpactOperations, impactJournalOwner } from "../commands/impact-operation";
import { executeImpactOperation } from "../commands/execute-impact-operation";
import { impactError } from "../shared/impact-error";
import { shouldRefreshImpact } from "./impact-refresh";
export function useImpactAnalysis(scope: ImpactScope, id: string, permissions: ImpactPermissions, ru: boolean) {
  const http = useTmsHttpClient(); const api = useMemo(() => impactApi(http), [http]);
  const session = useTmsSession();
  const owner = JSON.stringify([session.subject, scope.workspaceId, scope.projectId, id, permissions]);
  const current = useRef(owner); current.current = owner;
  const read = useRef<AbortController | null>(null); const write = useRef<AbortController | null>(null);
  const [resource, setResource] = useState<TmsResource<ImpactAnalysis> | null>(null);
  const [resolvedOwner, setResolvedOwner] = useState("");
  const [loading, setLoading] = useState(false); const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null); const [journalVersion, setJournalVersion] = useState(0);
  const journal = useMemo(() => {
    let storage: Storage | undefined;
    try { if (typeof window !== "undefined") storage = window.sessionStorage; } catch { /* Some browsers disable session storage. */ }
    return new ImpactOperations(impactJournalOwner(session.subject, scope, id), session.subject ? storage : undefined);
  }, [session.subject, scope.workspaceId, scope.projectId, id]);
  const accept = useCallback((result: TmsResource<ImpactAnalysis>) => {
    if (result.data.id !== id || result.data.workspaceId !== scope.workspaceId || result.data.projectId !== scope.projectId)
      throw new Error("IMPACT_SCOPE_MISMATCH");
    if (current.current === owner) { setResource(result); setResolvedOwner(owner); }
    return result;
  }, [id, scope.workspaceId, scope.projectId, owner]);
  const load = useCallback(async () => {
    read.current?.abort(); if (!permissions.read) return;
    const controller = new AbortController(); read.current = controller; setLoading(true); setError(null);
    try { const result = await api.detail(scope, id, controller.signal);
      if (!controller.signal.aborted && current.current === owner) accept(result);
    } catch (cause) { if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru)); }
    finally { if (!controller.signal.aborted && current.current === owner) setLoading(false); }
  }, [api, accept, owner, id, scope.workspaceId, scope.projectId, permissions.read, ru]);
  useEffect(() => { setResource(null); setResolvedOwner(""); setPending(false); void load();
    return () => { read.current?.abort(); write.current?.abort(); }; }, [load]);
  const data = resolvedOwner === owner ? resource?.data ?? null : null;
  useEffect(() => {
    if (!data || pending || loading || error || !shouldRefreshImpact(data)) return;
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    const timer = setTimeout(visible, 5_000); document.addEventListener("visibilitychange", visible);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", visible); };
  }, [data, pending, loading, error, load]);
  const command = async (input: ImpactCommand) => {
    if (write.current || !resource?.etag || !data || !session.subject) return;
    if (!impactCommandAllowed(input, permissions)) return;
    let operation: ReturnType<ImpactOperations["begin"]>;
    try { operation = journal.begin(input, resource.etag); }
    catch (cause) { setError(impactError(cause, ru)); return; }
    const controller = new AbortController();
    write.current = controller; read.current?.abort(); setPending(true); setError(null);
    try {
      await executeImpactOperation({ scope, id, operation, signal: controller.signal, owns: () => current.current === owner },
        { api, journal, accept });
    } catch (cause) {
      if (!controller.signal.aborted && current.current === owner) setError(impactError(cause, ru));
    } finally { if (write.current === controller) write.current = null;
      if (current.current === owner) { setPending(false); setJournalVersion((value) => value + 1); } }
  };
  void journalVersion;
  const unresolved = journal.pending();
  return { data, loading, pending, error, refresh: load, command, unresolved, etag: resource?.etag, identityReady: Boolean(session.subject),
    canRetryUnresolved: Boolean(session.subject && resource?.etag && unresolved && impactCommandAllowed(unresolved.command, permissions)) };
}
