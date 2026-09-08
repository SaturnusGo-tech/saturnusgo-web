import { useCallback, useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getVerificationQueue } from "../data/verification-api";
import type { VerificationQueue } from "../model/verification";

interface Resource { scope: string; data: VerificationQueue | null; pending: boolean; error: string }
export function useVerificationQueue(projectId: string, enabled: boolean, ru: boolean) {
  const http = useTmsHttpClient();
  const scope = JSON.stringify([projectId, enabled]);
  const currentScope = useRef(scope); currentScope.current = scope;
  const request = useRef<AbortController | null>(null);
  const [resource, setResource] = useState<Resource>({ scope: "", data: null, pending: false, error: "" });
  const load = useCallback(async () => {
    request.current?.abort();
    if (!enabled || !projectId) return null;
    const controller = new AbortController(); request.current = controller;
    setResource((old) => ({ scope, data: old.scope === scope ? old.data : null,
      pending: true, error: "" }));
    try {
      const first = await getVerificationQueue(http, projectId, 0, controller.signal);
      if (currentScope.current !== scope || controller.signal.aborted) return null;
      setResource({ scope, data: first.data, pending: false, error: "" });
      return first.data;
    } catch (error) {
      if (currentScope.current !== scope || controller.signal.aborted) return null;
      const message = error instanceof TmsApiError && error.status === 403
        ? (ru ? "Нет доступа к очереди проверки." : "You cannot access the verification queue.")
        : error instanceof TmsApiError && error.status === 409
        ? (ru ? "Очередь изменилась во время загрузки. Обновите её." : "The queue changed while loading. Refresh it.")
        : (ru ? "Не удалось загрузить исправления. Нажмите «Проверить исправления», чтобы повторить." : "Could not load the fixes. Select Verify fixes to retry.");
      setResource((old) => ({ ...old, scope, pending: false, error: message }));
      return null;
    }
  }, [enabled, http, projectId, ru, scope]);
  useEffect(() => {
    if (!enabled) return;
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { request.current?.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [enabled, load]);
  const visible = resource.scope === scope ? resource : null;
  return { data: visible?.data ?? null,
    pending: enabled && (visible?.pending ?? true), error: visible?.error ?? "",
    refresh: load };
}
export type VerificationQueueState = ReturnType<typeof useVerificationQueue>;
