import { useEffect, useRef, useState } from "react";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { getCaseMaintenance, changeCaseMaintenance } from "../data/maintenance-api";
import type { CaseMaintenance, MaintenanceChange } from "../model/case-maintenance";
type Failure = "read" | "write" | "conflict" | "denied" | null;
type State = { caseId: string; http: TmsHttpClient | null; projection: CaseMaintenance | null; confirmed: CaseMaintenance | null;
  etag: string | null; loading: boolean; pending: boolean; error: Failure };
export function useCaseMaintenance(http: TmsHttpClient | null, caseId: string, enabled: boolean,
  onConfirmed: (caseId: string, projection: CaseMaintenance) => void, initial?: CaseMaintenance) {
  const [reload, setReload] = useState(0);
  const empty = (): State => ({ caseId, http, projection: initial ?? null, confirmed: initial ?? null, etag: null, loading: enabled, pending: false, error: null });
  const [state, setState] = useState<State>(empty);
  const controller = useRef<AbortController | null>(null);
  const writing = useRef(false), operation = useRef<PendingOperation | null>(null);
  const current = useRef({ caseId, http, enabled }); current.current = { caseId, http, enabled };
  const accept = useRef(onConfirmed); accept.current = onConfirmed;
  const owned = state.caseId === caseId && state.http === http ? state : empty();
  // Catalog/detail GETs carry an independent maintenance ETag, even when content's ETag is unchanged.
  const visible = owned.error !== "denied" && initial && initial.rowVersion > (owned.confirmed?.rowVersion ?? -1)
    ? { ...owned, projection: initial, confirmed: initial, etag: initial.etag } : owned;
  const latest = useRef(visible); latest.current = visible;
  const matches = () => current.current.caseId === caseId && current.current.http === http && current.current.enabled === enabled;
  function receive(resource: Awaited<ReturnType<typeof getCaseMaintenance>>, error: Failure = null) {
    const base = latest.current;
    const confirmed = base.confirmed && base.confirmed.rowVersion > resource.data.rowVersion ? base.confirmed : resource.data;
    setState({ ...base, projection: confirmed, confirmed, etag: confirmed === resource.data ? resource.etag : confirmed.etag,
      loading: false, pending: false, error });
    accept.current(caseId, confirmed);
  }
  useEffect(() => {
    const active = new AbortController(); controller.current = active;
    writing.current = false; operation.current = null;
    setState(previous => previous.caseId === caseId && previous.http === http
      ? { ...previous, projection: previous.confirmed, loading: enabled, pending: false, error: null } : empty());
    if (http && enabled && caseId) void getCaseMaintenance(http, caseId, active.signal).then(resource => {
      if (!active.signal.aborted && matches()) receive(resource);
    }).catch(error => {
      if (active.signal.aborted || !matches()) return;
      const denied = error instanceof TmsApiError && [401,403,404].includes(error.status);
      setState({ ...latest.current, ...(denied ? { projection: null, confirmed: null, etag: null } : {}), loading: false, error: denied ? "denied" : "read" });
    });
    return () => { active.abort(); controller.current?.abort(); };
  }, [http, caseId, enabled, reload]);
  async function change(input: MaintenanceChange) {
    if (!http || !enabled || !matches() || !visible.etag || visible.loading || writing.current || !visible.confirmed) return false;
    const active = controller.current;
    if (!active || active.signal.aborted) return false;
    writing.current = true;
    const pending = resolvePendingOperation(operation.current, JSON.stringify([caseId, visible.etag, input])); operation.current = pending;
    setState({ ...visible, projection: { ...visible.confirmed, status: input.status }, pending: true, error: null });
    try {
      const resource = await changeCaseMaintenance(http, caseId, input, visible.etag, pending.key, active.signal);
      if (active.signal.aborted || !matches()) return false;
      operation.current = null; receive(resource); return true;
    } catch (error) {
      if (active.signal.aborted || !matches()) return false;
      const status = error instanceof TmsApiError ? error.status : 0;
      const denied = [401,403,404].includes(status), conflict = [409,412,428].includes(status);
      const base = latest.current;
      setState({ ...base, projection: denied ? null : base.confirmed, confirmed: denied ? null : base.confirmed,
        etag: denied || conflict ? null : base.etag, pending: false, error: denied ? "denied" : conflict ? "conflict" : "write" });
      if (conflict) {
        operation.current = null;
        try {
          const fresh = await getCaseMaintenance(http, caseId, active.signal);
          if (!active.signal.aborted && matches()) receive(fresh, "conflict");
        } catch { /* Keep writes disabled until Retry obtains a current maintenance ETag. */ }
      }
      return false;
    } finally { if (!active.signal.aborted && matches()) writing.current = false; }
  }
  return { ...visible, change, refresh: () => setReload(value => value + 1) };
}
