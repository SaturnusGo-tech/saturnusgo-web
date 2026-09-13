import { useCallback, useEffect, useRef, useState } from "react";
import type { RunItem, TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { collectRunVerification } from "../../application/collect-verification-entries";
import { getRunVerification } from "../../data/verification-api";
import type { VerificationRunEntry } from "../../model/verification";

type Resource = { scope: string; items: VerificationRunEntry[]; pending: boolean; error: boolean };
export function useRunVerificationContext(run: TestRunSummary | null, item: RunItem | null, connected: boolean) {
  const http = useTmsHttpClient();
  const enabled = Boolean(connected && run?.configuration.fixVerificationScope && item);
  const scope = JSON.stringify([enabled, run?.projectId, run?.id, item?.id, item?.caseId]);
  const owner = useRef(scope); owner.current = scope;
  const controller = useRef<AbortController | null>(null);
  const [resource, setResource] = useState<Resource>({ scope: "", items: [], pending: false, error: false });
  const refresh = useCallback(async () => {
    controller.current?.abort();
    if (!enabled || !run || !item) return;
    const request = new AbortController(); controller.current = request;
    setResource((old) => ({ scope, items: old.scope === scope ? old.items : [], pending: true, error: false }));
    try {
      const entries = await collectRunVerification((offset) => getRunVerification(http, run.id, item.caseId, offset, request.signal), request.signal);
      if (request.signal.aborted || owner.current !== scope) return;
      const items = entries.filter((entry) => entry.runItemId === item.id && entry.caseId === item.caseId);
      setResource({ scope, items, pending: false, error: false });
    } catch {
      if (!request.signal.aborted && owner.current === scope) setResource({ scope, items: [], pending: false, error: true });
    }
  }, [enabled, http, run?.id, item?.id, item?.caseId, scope]);
  useEffect(() => {
    void refresh();
    return () => controller.current?.abort();
  }, [refresh, item?.status, item?.activeAttemptNo, item?.updatedAt]);
  const current = resource.scope === scope ? resource : null;
  return { enabled, items: current?.items ?? [], pending: enabled && (current?.pending ?? true),
    error: current?.error ?? false, refresh };
}

export type RunVerificationContextState = ReturnType<typeof useRunVerificationContext>;
