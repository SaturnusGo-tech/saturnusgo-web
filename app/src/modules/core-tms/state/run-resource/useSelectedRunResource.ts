import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { Bootstrap, RunItem, RunItemSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { getRunItem } from "../../runs/data/run-api";
import { loadSelectedRun } from "./load-selected-run";

export function useSelectedRunResource({ http, connection, projectId, selectedRunId, selectedRunItemId,
  setSelectedRunItemId, setData }: {
  http: TmsHttpClient; connection: string; projectId: string; selectedRunId: string | null;
  selectedRunItemId: string | null; setSelectedRunItemId: Dispatch<SetStateAction<string | null>>;
  setData: Dispatch<SetStateAction<Bootstrap>>;
}) {
  const [runItems, setRunItems] = useState<RunItemSummary[]>([]);
  const [selectedRunEtag, setSelectedRunEtag] = useState<string | null>(null);
  const [selectedRunItemDetail, setSelectedRunItemDetail] = useState<RunItem | null>(null);
  const [selectedRunItemEtag, setSelectedRunItemEtag] = useState<string | null>(null);
  const [runResourceError, setError] = useState(false);
  const [runResourceLoading, setLoading] = useState(false);
  const [generation, setGeneration] = useState(0);
  const scope = JSON.stringify([projectId, selectedRunId, generation]);
  const [requestScope, setRequestScope] = useState("");
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const selectedItemAvailable = runItems.some((item) => item.id === selectedRunItemId);
  const retryRunResource = useCallback(() => setGeneration((current) => current + 1), []);
  useEffect(() => {
    setRunItems([]); setSelectedRunEtag(null); setSelectedRunItemDetail(null); setSelectedRunItemEtag(null);
    setError(false); setLoading(false); setRequestScope(scope); setLoadedScope(null);
    if (connection !== "connected" || !selectedRunId || !projectId) return;
    const controller = new AbortController(); setLoading(true);
    void loadSelectedRun(http, projectId, selectedRunId, controller.signal).then(({ run, items }) => {
      controller.signal.throwIfAborted();
      setData((current) => ({ ...current, runs: current.runs.some((item) => item.id === run.data.id)
        ? current.runs.map((item) => item.id === run.data.id ? run.data : item) : [...current.runs, run.data] }));
      setSelectedRunEtag(run.etag); setRunItems(items); setLoadedScope(scope);
      setSelectedRunItemId((current) => current && items.some((item) => item.id === current)
        ? current : items[0]?.id ?? null);
    }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [connection, http, selectedRunId, projectId, scope, generation, setData, setSelectedRunItemId]);
  useEffect(() => {
    setSelectedRunItemDetail(null); setSelectedRunItemEtag(null);
    if (connection !== "connected" || !selectedRunId || !selectedRunItemId || loadedScope !== scope
      || !selectedItemAvailable || runResourceLoading || runResourceError) return;
    const controller = new AbortController();
    void getRunItem(http, selectedRunId, selectedRunItemId, controller.signal).then((resource) => {
      controller.signal.throwIfAborted();
      if (resource.data.id !== selectedRunItemId) throw new Error("Run item selection mismatch");
      setSelectedRunItemDetail(resource.data); setSelectedRunItemEtag(resource.etag);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [connection, http, selectedRunId, selectedRunItemId, loadedScope, scope, selectedItemAvailable,
    runResourceLoading, runResourceError, generation]);
  const ready = connection === "connected" && loadedScope === scope;
  const failed = connection === "connected" && requestScope === scope && runResourceError;
  return { runItems: ready ? runItems : [], setRunItems, selectedRunEtag: ready ? selectedRunEtag : null,
    setSelectedRunEtag, selectedRunItemDetail: ready ? selectedRunItemDetail : null,
    setSelectedRunItemDetail, selectedRunItemEtag: ready ? selectedRunItemEtag : null, setSelectedRunItemEtag,
    runResourceReady: ready, runResourceError: failed, runResourceLoading: connection === "connected" && Boolean(selectedRunId)
      && (!ready || runResourceLoading) && !failed, retryRunResource };
}
