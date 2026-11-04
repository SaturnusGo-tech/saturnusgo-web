import { captureDesktopAttempt, DESKTOP_ATTEMPT_KEY, isDesktopEntry, takeDesktopAttempt,
  type DesktopAttemptState, type DesktopAttemptTarget } from "./attempt-storage";
let failedOrigin: string | null = null;
let activeOrigin: string | null = null;
export function captureBrowserDesktopAttempt(managedWorkspace = false): DesktopAttemptState {
  if (typeof window === "undefined" || !isDesktopEntry(window.location.pathname, managedWorkspace)) return { status: "none" };
  const requested = new URLSearchParams(window.location.search).has("desktopAttempt");
  try {
    if (!window.sessionStorage) return { status: requested || failedOrigin === window.location.origin ? "blocked" : "none" };
    const state = captureDesktopAttempt(window.sessionStorage, window.location, Date.now(), managedWorkspace);
    if (state.status === "active") activeOrigin = window.location.origin;
    if (state.status === "blocked") failedOrigin = window.location.origin;
    else if (requested && state.status === "active") failedOrigin = null;
    if (requested) {
      const url = new URL(window.location.href); url.searchParams.delete("desktopAttempt");
      window.history?.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    return failedOrigin === window.location.origin ? { status: "blocked" } : state;
  } catch {
    if (requested) failedOrigin = window.location.origin;
    return { status: failedOrigin === window.location.origin ? "blocked" : "none" };
  }
}
export function takeBrowserDesktopAttempt(): DesktopAttemptTarget {
  if (typeof window === "undefined") return { status: "none" };
  if (failedOrigin === window.location.origin) return { status: "blocked" };
  try {
    const target = window.sessionStorage ? takeDesktopAttempt(window.sessionStorage, window.location.origin) : { status: "none" as const };
    activeOrigin = null; return target;
  } catch { return { status: activeOrigin === window.location.origin ? "blocked" : "none" }; }
}
export function clearBrowserDesktopAttempt(): void {
  failedOrigin = null; activeOrigin = null;
  try { if (typeof window !== "undefined") window.sessionStorage?.removeItem(DESKTOP_ATTEMPT_KEY); } catch { /* Cancellation stays local if storage is unavailable. */ }
  try {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("desktopAttempt")) {
      const url = new URL(window.location.href); url.searchParams.delete("desktopAttempt");
      window.history?.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch { /* The native broker also expires or cancels its server attempt. */ }
}
