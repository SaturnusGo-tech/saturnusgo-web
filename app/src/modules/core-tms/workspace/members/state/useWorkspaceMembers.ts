import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listWorkspaceMembers } from "../data/member-api";
import type { WorkspaceMember } from "../model/member";

export function useWorkspaceMembers(workspaceId: string, enabled: boolean) {
  const http = useTmsHttpClient();
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ scope: string; items: WorkspaceMember[]; cursor: string | null; loading: boolean; error: boolean }>({ scope: "", items: [], cursor: null, loading: enabled, error: false });
  const active = useRef<AbortController | null>(null);
  const scope = `${workspaceId}:${search}`;
  const current = useRef(scope); current.current = scope;
  async function load(cursor: string | null) {
    if (!enabled || !workspaceId) return;
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setState((previous) => ({ scope, items: cursor ? previous.items : [], cursor, loading: true, error: false }));
    try {
      const page = await listWorkspaceMembers(http, workspaceId, search, cursor, controller.signal);
      if (controller.signal.aborted || current.current !== scope) return;
      setState((previous) => ({ scope, items: cursor ? [...new Map([...previous.items, ...page.items].map((item) => [item.id, item])).values()] : page.items,
        cursor: page.nextCursor, loading: false, error: false }));
    } catch {
      if (!controller.signal.aborted && current.current === scope) setState((previous) => ({ ...previous, loading: false, error: true }));
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { if (enabled) void load(null); }, search ? 200 : 0);
    return () => { window.clearTimeout(timer); active.current?.abort(); };
  }, [http, workspaceId, enabled, search, revision]);
  const visible = state.scope === scope ? state : { scope, items: [], cursor: null, loading: enabled, error: false };
  return { ...visible, search, setSearch, retry: () => setRevision((value) => value + 1),
    more: () => { if (visible.cursor && !visible.loading) void load(visible.cursor); } };
}
