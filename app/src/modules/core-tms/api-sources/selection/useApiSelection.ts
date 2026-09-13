import { useEffect, useRef, useState } from "react";
import { chooseApiSource, type ApiSource } from "../model/api-source";
export function useApiSelection(workspaceId: string, contextKey: string, sources: ApiSource[], loading: boolean) {
  const previous = useRef<string | null>(null);
  const workspaceKey = `falcon:api:${workspaceId}:current`;
  if (!previous.current) { try { previous.current = sessionStorage.getItem(workspaceKey); } catch { /* Optional browser memory. */ } }
  const [choice, setChoice] = useState<string | null>(null);
  const memoryKey = `falcon:api:${workspaceId}:${contextKey}`;
  const remembered = useRef<{ key: string; id: string | null }>({ key: "", id: null });
  if (remembered.current.key !== memoryKey) {
    let id: string | null = null;
    try { id = typeof window === "undefined" ? null : sessionStorage.getItem(memoryKey); } catch { /* Storage may be restricted. */ }
    remembered.current = { key: memoryKey, id };
  }
  const id = loading ? null : chooseApiSource(sources, choice ?? previous.current, remembered.current.id);
  useEffect(() => {
    if (loading) return;
    previous.current = id; setChoice(id);
    try { if (id) { sessionStorage.setItem(memoryKey, id); sessionStorage.setItem(workspaceKey, id); } else sessionStorage.removeItem(memoryKey); } catch { /* Selection remains available in memory. */ }
  }, [id, loading, memoryKey]);
  return { source: sources.find(source => source.id === id) ?? null, select: setChoice };
}
