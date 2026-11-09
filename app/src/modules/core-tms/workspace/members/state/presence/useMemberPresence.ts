import { useEffect } from "react";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";

const HEARTBEAT_INTERVAL = 45_000;
const MINIMUM_INTERVAL = 25_000;

export function useMemberPresence(http: TmsHttpClient | null, workspaceId: string, connected: boolean) {
  useEffect(() => {
    if (!http || !connected || !workspaceId) return;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    let visibleSession: AbortController | undefined;
    let timer: number | undefined;
    let lastSent = Number.NEGATIVE_INFINITY;
    const send = () => {
      if (!visibleSession || Date.now() - lastSent < MINIMUM_INTERVAL) return;
      lastSent = Date.now();
      // Network recovery is retried on the next foreground pulse.
      void http.mutate<void>(`/workspaces/${encodeURIComponent(workspaceId)}/actors/me/presence`,
        "POST", { timeZone }, visibleSession.signal).catch(() => undefined);
    };
    const pause = () => {
      visibleSession?.abort();
      visibleSession = undefined;
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const update = () => {
      if (document.visibilityState !== "visible") {
        pause();
        return;
      }
      if (!visibleSession) {
        visibleSession = new AbortController();
        timer = window.setInterval(send, HEARTBEAT_INTERVAL);
      }
      send();
    };

    update();
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      pause();
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [http, workspaceId, connected]);
}
