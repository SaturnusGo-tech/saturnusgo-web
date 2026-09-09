import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { loadPortfolioOptions } from "../../../portfolios/application/portfolio-options";
import type { Portfolio } from "../../../portfolios/model/portfolio";

export function useProjectPortfolioOptions(workspaceId: string, enabled: boolean) {
  const http = useTmsHttpClient();
  const [items, setItems] = useState<readonly Portfolio[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  async function load(next: string | null) {
    if (!enabled || !workspaceId) return;
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setError(false);
    try {
      const page = await loadPortfolioOptions(http, workspaceId, next, request.signal);
      if (!request.signal.aborted) {
        setItems((previous) => next ? [...new Map([...previous, ...page.items].map((item) => [item.id, item])).values()] : page.items);
        setCursor(page.nextCursor); setLoading(false);
      }
    } catch { if (!request.signal.aborted) { setLoading(false); setError(true); } }
  }
  useEffect(() => {
    setItems([]); setCursor(null); setLoading(enabled && Boolean(workspaceId)); setError(false);
    void load(null);
    return () => controller.current?.abort();
  }, [http, workspaceId, enabled]);
  return { items, cursor, loading, error, retry: () => void load(null), more: () => { if (cursor && !loading) void load(cursor); } };
}
