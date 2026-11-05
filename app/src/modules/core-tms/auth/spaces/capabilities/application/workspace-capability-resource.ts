import type { WorkspaceCapabilities, WorkspaceCapabilitiesReader } from "../domain/workspace-capabilities";
export function createWorkspaceCapabilityResource(read: WorkspaceCapabilitiesReader, workspaceId: string) {
  let state: { value: WorkspaceCapabilities | null; loading: boolean; error: string | null } = { value: null, loading: true, error: null };
  const listeners = new Set<() => void>(); let active: AbortController | null = null;
  const emit = () => { for (const listener of listeners) listener(); };
  const refresh = () => {
    active?.abort(); const controller = new AbortController(); active = controller;
    state = { value: null, loading: true, error: null }; emit();
    void read(workspaceId, controller.signal).then(value => {
      if (!controller.signal.aborted) { state = { value, loading: false, error: null }; emit(); }
    }, error => {
      if (!controller.signal.aborted) { state = { value: null, loading: false, error: error && typeof error === "object" && "code" in error ? String(error.code) : "SERVICE_UNAVAILABLE" }; emit(); }
    });
  };
  const changed = (event: Event) => { if ((event as CustomEvent<{ workspaceId?: string }>).detail?.workspaceId === workspaceId) refresh(); };
  return { snapshot: () => state, refresh,
    subscribe: (listener: () => void) => { listeners.add(listener); if (listeners.size === 1) { if (typeof window !== "undefined") window.addEventListener("falcon:billing-changed", changed); refresh(); } return () => { listeners.delete(listener); if (!listeners.size) { if (typeof window !== "undefined") window.removeEventListener("falcon:billing-changed", changed); active?.abort(); state = { value: null, loading: true, error: null }; } }; } };
}
