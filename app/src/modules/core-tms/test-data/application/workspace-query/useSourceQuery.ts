import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceDataPort } from "../ports/workspace-data-port";
import type { SourceQueryResult } from "../../model/workspace/data-workspace";
export function useSourceQuery(port: WorkspaceDataPort | undefined, sourceIds: readonly string[]) {
  const active = useRef<AbortController | null>(null), attempted = useRef({ sql: "", page: 0 }), successful = useRef(""), sources = sourceIds.join("\0");
  const [result, setResult] = useState<SourceQueryResult | null>(null), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  useEffect(() => { active.current?.abort(); successful.current = ""; setResult(null); setError(null); setPending(false); setPage(0); return () => active.current?.abort(); }, [port, sources]);
  const run = useCallback(async (sql: string, index = 0) => {
    if (!port || !sourceIds.length || !sql.trim()) return;
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setPending(true); setError(null); attempted.current = { sql, page: index };
    try {
      const value = await port.query({ sourceIds, sql, limit: 50, offset: index * 50 }, controller.signal);
      if (!controller.signal.aborted) { successful.current = sql; setResult(value); setPage(index); }
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure && typeof failure === "object" && "code" in failure && typeof failure.code === "string" ? failure.code : "REQUEST_FAILED");
    } finally { if (!controller.signal.aborted) setPending(false); }
  }, [port, sources]); // A stable source identity prevents cancelled requests on unrelated panel renders.
  return { result, pending, error, page, run, changePage: (index: number) => void run(successful.current, index), retry: () => void run(attempted.current.sql, attempted.current.page) };
}
