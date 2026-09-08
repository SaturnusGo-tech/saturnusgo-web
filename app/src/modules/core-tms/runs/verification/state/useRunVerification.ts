import { useCallback, useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { collectRunVerification } from "../application/collect-verification-entries";
import { getRunVerification } from "../data/verification-api";
import type { VerificationRunEntry } from "../model/verification";

export function useRunVerification(runId: string, caseId: string | null, enabled: boolean, ru: boolean) {
  const http = useTmsHttpClient();
  const scope = JSON.stringify([runId, caseId, enabled]);
  const currentScope = useRef(scope); currentScope.current = scope;
  const request = useRef<AbortController | null>(null);
  const [resource, setResource] = useState({ scope: "", entries: [] as VerificationRunEntry[], pending: false, error: "" });
  const refresh = useCallback(async () => {
    request.current?.abort();
    if (!enabled || !runId) return;
    const controller = new AbortController(); request.current = controller;
    setResource((old) => ({ scope, entries: old.scope === scope ? old.entries : [], pending: true, error: "" }));
    try {
      const entries = await collectRunVerification((offset) =>
        getRunVerification(http, runId, caseId, offset, controller.signal), controller.signal);
      if (currentScope.current !== scope || controller.signal.aborted) return;
      setResource({ scope, entries, pending: false, error: "" });
    } catch {
      if (currentScope.current !== scope || controller.signal.aborted) return;
      setResource((old) => ({ ...old, pending: false, error: ru
        ? "Не удалось обновить связанные исправления." : "Could not refresh the linked fixes." }));
    }
  }, [caseId, enabled, http, ru, runId, scope]);
  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const update = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    return () => { request.current?.abort(); window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, [enabled, refresh]);
  return { entries: resource.scope === scope ? resource.entries : [],
    pending: enabled && (resource.scope !== scope || resource.pending),
    error: resource.scope === scope ? resource.error : "", refresh };
}
