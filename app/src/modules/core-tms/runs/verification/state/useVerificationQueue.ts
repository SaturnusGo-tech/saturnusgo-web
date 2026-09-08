import { useCallback, useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { collectVerificationQueue } from "../application/collect-verification-entries";
import { getVerificationQueue } from "../data/verification-api";
import type { VerificationQueue } from "../model/verification";

interface Resource { scope: string; data: VerificationQueue | null; complete: boolean; pending: boolean; error: string }
export function useVerificationQueue(projectId: string, enabled: boolean, ru: boolean) {
  const http = useTmsHttpClient();
  const scope = JSON.stringify([projectId, enabled]);
  const currentScope = useRef(scope); currentScope.current = scope;
  const request = useRef<AbortController | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [resource, setResource] = useState<Resource>({ scope: "", data: null, complete: false, pending: false, error: "" });
  const load = useCallback(async (full = false) => {
    request.current?.abort();
    if (!enabled || !projectId) return;
    const controller = new AbortController(); request.current = controller;
    setResource((old) => ({ scope, data: old.scope === scope ? old.data : null,
      complete: old.scope === scope && old.complete, pending: true, error: "" }));
    try {
      const first = await getVerificationQueue(http, projectId, 0, controller.signal);
      const data = full ? await collectVerificationQueue((offset) => offset === 0 ? Promise.resolve(first)
        : getVerificationQueue(http, projectId, offset, controller.signal), controller.signal) : first.data;
      if (currentScope.current !== scope || controller.signal.aborted) return;
      setResource({ scope, data, complete: full || !first.meta.hasMore, pending: false, error: "" });
    } catch (error) {
      if (currentScope.current !== scope || controller.signal.aborted) return;
      const message = error instanceof TmsApiError && error.status === 403
        ? (ru ? "Нет доступа к очереди проверки." : "You cannot access the verification queue.")
        : error instanceof TmsApiError && error.status === 409
        ? (ru ? "Очередь изменилась во время загрузки. Обновите её." : "The queue changed while loading. Refresh it.")
        : (ru ? "Не удалось загрузить исправления. Повторите обновление." : "Could not load the fixes. Refresh to retry.");
      setResource((old) => ({ ...old, scope, pending: false, error: message }));
    }
  }, [enabled, http, projectId, ru, scope]);
  useEffect(() => { setExpanded(false); }, [scope]);
  useEffect(() => {
    if (!enabled) return;
    void load(expanded);
    const refresh = () => { if (document.visibilityState === "visible") void load(expanded); };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { request.current?.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [enabled, expanded, load]);
  const visible = resource.scope === scope ? resource : null;
  return { data: visible?.data ?? null, complete: visible?.complete ?? false,
    pending: enabled && (visible?.pending ?? true), error: visible?.error ?? "",
    expanded, setExpanded, refresh: () => load(expanded) };
}
export type VerificationQueueState = ReturnType<typeof useVerificationQueue>;
