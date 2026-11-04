import { rememberContinuation, takeContinuation } from "./continuation-storage";
export function rememberBrowserContinuation(): void {
  try { if (typeof window !== "undefined") rememberContinuation(window.sessionStorage, window.location); } catch { /* Optional browser storage. */ }
}
export function takeBrowserContinuation(workspaceId?: string | null): string | null {
  try { return typeof window === "undefined" ? null : takeContinuation(window.sessionStorage, window.location.origin, workspaceId); } catch { return null; }
}
