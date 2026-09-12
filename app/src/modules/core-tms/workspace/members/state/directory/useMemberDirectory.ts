import { useEffect, useMemo, useState } from "react";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { listWorkspaceMembers } from "../../data/member-api";
import type { WorkspaceMember } from "../../model/member";

// Loaded once per mounted workspace, never on individual query keystrokes.
export function useMemberDirectory(workspaceId: string, enabled: boolean) {
  const http = useTmsHttpClient(); const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ workspaceId: string; items: WorkspaceMember[]; loading: boolean; error: boolean }>({ workspaceId: "", items: [], loading: false, error: false });
  useEffect(() => {
    const controller = new AbortController();
    setState({ workspaceId, items: [], loading: enabled, error: false });
    if (workspaceId && enabled) void (async () => {
      const items = new Map<string, WorkspaceMember>(); const cursors = new Set<string>(); let cursor: string | null = null;
      try {
        do {
          const page = await listWorkspaceMembers(http, workspaceId, "", cursor, controller.signal);
          if (controller.signal.aborted) return;
          page.items.forEach(item => items.set(item.id, item)); cursor = page.nextCursor;
          if (cursor && cursors.has(cursor)) throw new Error("Repeated member cursor");
          if (cursor) cursors.add(cursor);
        } while (cursor);
        setState({ workspaceId, items: [...items.values()], loading: false, error: false });
      } catch { if (!controller.signal.aborted) setState({ workspaceId, items: [], loading: false, error: true }); }
    })();
    return () => controller.abort();
  }, [http, workspaceId, enabled, revision]);
  const items = state.workspaceId === workspaceId ? state.items : [];
  const members = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  return { members, items, loading: enabled && (state.workspaceId !== workspaceId || state.loading),
    error: state.workspaceId === workspaceId && state.error, retry: () => setRevision(value => value + 1) };
}
