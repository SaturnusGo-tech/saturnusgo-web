import { useEffect, useRef, useState } from "react";
import type { GuideHistoryApi } from "../model/api";
import type { GuideChatSummary } from "../model/history";

export function useChatHistory(api: GuideHistoryApi | null, owner: string, revision: number, open: boolean) {
  const [query, setQuery] = useState(""), [search, setSearch] = useState("");
  const [items, setItems] = useState<GuideChatSummary[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  const active = useRef<AbortController | null>(null), key = `${owner}:${search}:${revision}`;
  const latest = useRef(key); latest.current = key;
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim().slice(0, 120)), 200); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { setQuery(""); setSearch(""); setItems([]); setCursor(null); }, [owner]);
  async function load(next: string | null) {
    if (!api || !open) return;
    active.current?.abort(); const request = new AbortController(); active.current = request;
    setLoading(true); setError(false);
    try {
      const result = await api.list(search, next, request.signal);
      if (!request.signal.aborted && latest.current === key) {
        setItems(old => next ? [...new Map([...old, ...result.items].map(item => [item.id, item])).values()] : result.items);
        setCursor(result.nextCursor);
      }
    } catch { if (!request.signal.aborted && latest.current === key) setError(true); }
    finally { if (!request.signal.aborted && latest.current === key) setLoading(false); }
  }
  useEffect(() => { setItems([]); setCursor(null); if (open) void load(null); return () => active.current?.abort(); }, [api, key, open, retry]);
  return { items, cursor, loading, error, query, setQuery, retry: () => setRetry(value => value + 1), more: () => void load(cursor) };
}
