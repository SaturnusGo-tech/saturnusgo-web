import { useEffect, useRef, useState } from "react";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { collectRunVerification } from "../../application/collect-verification-entries";
import { findLatestDefectRetest } from "../../application/defect/find-latest-defect-retest";
import { getRunVerification, getVerificationQueue } from "../../data/verification-api";

type Context = { scope: string; latest: TestRunSummary | null; failed: boolean };
export function useDefectRetestContext(workspaceId: string, projectId: string, defectId: string | undefined,
  runs: readonly TestRunSummary[], readable: boolean, open: boolean) {
  const http = useTmsHttpClient();
  const cache = useRef(new Map<string, ReadonlySet<string>>());
  const scope = JSON.stringify([workspaceId, projectId, defectId, readable]);
  const signature = JSON.stringify(runs.map(run => [run.id, run.name, run.build, run.environment, run.archivedAt]));
  const [context, setContext] = useState<Context>({ scope: "", latest: null, failed: false });
  const [count, setCount] = useState<{ scope: string; value: number | null; failed: boolean }>({ scope: "", value: null, failed: false });
  useEffect(() => {
    if (!readable || !defectId) return;
    const request = new AbortController();
    void findLatestDefectRetest(runs, projectId, defectId, async runId => {
      const key = JSON.stringify([workspaceId, projectId, runId]);
      const cached = cache.current.get(key); if (cached) return cached;
      const entries = await collectRunVerification(offset => getRunVerification(http, runId, null, offset, request.signal), request.signal);
      request.signal.throwIfAborted();
      const members = new Set(entries.map(entry => entry.defectId)); cache.current.set(key, members); return members;
    }, request.signal).then(latest => {
      if (!request.signal.aborted) setContext({ scope, latest, failed: false });
    }, () => { if (!request.signal.aborted) setContext({ scope, latest: null, failed: true }); });
    return () => request.abort();
  }, [scope, signature, http]);
  useEffect(() => {
    if (!readable || !defectId || !open) return;
    const request = new AbortController(); setCount({ scope, value: null, failed: false });
    void getVerificationQueue(http, projectId, 0, request.signal, defectId).then(page => {
      if (!request.signal.aborted) setCount({ scope, value: page.data.totalCases, failed: false });
    }, () => { if (!request.signal.aborted) setCount({ scope, value: null, failed: true }); });
    return () => request.abort();
  }, [scope, open, http]);
  return { latest: readable && context.scope === scope ? context.latest : null,
    contextError: readable && context.scope === scope && context.failed,
    linkedCases: count.scope === scope ? count.value : null, countError: count.scope === scope && count.failed };
}
