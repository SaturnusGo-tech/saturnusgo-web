import { useMemo, useSyncExternalStore } from "react";
import { useOptionalTmsHttpClient } from "../../../http/TmsHttpClientContext";
import { createWorkspaceCapabilityReader } from "../data/workspace-capability-api";
import { createWorkspaceCapabilityResource } from "../application/workspace-capability-resource";
const clients = new WeakMap<object, Map<string, ReturnType<typeof createWorkspaceCapabilityResource>>>();
const unavailable = { value: null, loading: false, error: null };
export function useWorkspaceCapabilities(workspaceId: string | null | undefined, enabled = true) {
  const http = useOptionalTmsHttpClient();
  const resource = useMemo(() => {
    if (!http || !workspaceId || !enabled) return null;
    let workspaces = clients.get(http); if (!workspaces) { workspaces = new Map(); clients.set(http, workspaces); }
    let value = workspaces.get(workspaceId);
    if (!value) { value = createWorkspaceCapabilityResource(createWorkspaceCapabilityReader(http), workspaceId); workspaces.set(workspaceId, value); }
    return value;
  }, [http, workspaceId, enabled]);
  const state = useSyncExternalStore(resource?.subscribe ?? (() => () => {}), resource?.snapshot ?? (() => unavailable), () => unavailable);
  return { ...state, reload: resource?.refresh ?? (() => {}) };
}
