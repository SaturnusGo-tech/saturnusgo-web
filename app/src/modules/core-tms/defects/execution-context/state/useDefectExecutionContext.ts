import { useEffect, useState } from "react";
import type { Defect, RunAttempt, RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getRun, getRunAttempt, getRunItem } from "../../../runs/data/run-api";

export type DefectExecutionContextInput = {
  readonly workspaceId: string;
  readonly defect: Defect;
  readonly run?: TestRunSummary;
  readonly connected: boolean;
};
export type DefectExecutionContext = {
  readonly run?: TestRunSummary;
  readonly item?: RunItem;
  readonly attempt?: RunAttempt;
  readonly pending: boolean;
  readonly error: boolean;
};
type ScopedContext = DefectExecutionContext & { scope: string; client: TmsHttpClient | null };

export function useDefectExecutionContext({ workspaceId, defect, run, connected }: DefectExecutionContextInput): DefectExecutionContext {
  const http = useOptionalTmsHttpClient();
  const enabled = Boolean(connected && workspaceId && defect.projectId && defect.id && defect.runId);
  const provided = enabled && run?.id === defect.runId && run.projectId === defect.projectId ? run : undefined;
  const scope = JSON.stringify([workspaceId, defect.projectId, defect.id, defect.runId,
    defect.runItemId, defect.sourceCaseId, defect.attemptNo, connected, Boolean(provided)]);
  const [context, setContext] = useState<ScopedContext>({ scope: "", client: null, pending: false, error: false });

  useEffect(() => {
    if (!enabled || !http || !defect.runId) return;
    const request = new AbortController();
    let source = provided;
    setContext({ scope, client: http, run: source, pending: true, error: false });
    void (async () => {
      source ??= (await getRun(http, defect.runId!, request.signal)).data;
      request.signal.throwIfAborted();
      if (source.id !== defect.runId || source.projectId !== defect.projectId) {
        source = undefined;
        throw new Error("Historical run does not match the defect scope.");
      }
      setContext({ scope, client: http, run: source, pending: Boolean(defect.runItemId), error: false });
      const item = defect.runItemId ? (await getRunItem(http, source.id, defect.runItemId, request.signal)).data : undefined;
      request.signal.throwIfAborted();
      if (item && (item.id !== defect.runItemId || (defect.sourceCaseId && item.caseId !== defect.sourceCaseId))) {
        throw new Error("Historical run item does not match the defect scope.");
      }
      let attempt = item?.attempts.find(entry => entry.attemptNo === defect.attemptNo);
      if (item && defect.attemptNo && !attempt) {
        attempt = await getRunAttempt(http, source.id, item.id, defect.attemptNo, request.signal);
        request.signal.throwIfAborted();
        if (attempt.attemptNo !== defect.attemptNo) throw new Error("Original attempt does not match the defect occurrence.");
      }
      setContext({ scope, client: http, run: source, item, attempt, pending: false, error: false });
    })().catch(() => {
      if (!request.signal.aborted) setContext({ scope, client: http, run: source, pending: false, error: true });
    });
    return () => request.abort();
  }, [scope, enabled, http]);

  if (!enabled) return { pending: false, error: false };
  if (!http) return { pending: false, error: true };
  if (context.scope !== scope || context.client !== http) return { run: provided, pending: true, error: false };
  return { run: provided ?? context.run, item: context.item, attempt: context.attempt, pending: context.pending, error: context.error };
}
