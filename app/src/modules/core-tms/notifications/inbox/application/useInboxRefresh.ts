import { useEffect, useRef } from "react";
import { isFalconDesktop } from "../../../auth/sign-in/domain/desktop-mode";

/** Keep polling lifetime tied to the transport and popup, not resource updates. */
export function useInboxRefresh(scope: unknown, connected: boolean, open: boolean,
  refresh: (reset?: boolean) => Promise<void>, dismiss: () => void) {
  const actions = useRef({ refresh, dismiss });
  actions.current = { refresh, dismiss };
  useEffect(() => {
    if (!connected) { actions.current.dismiss(); return; }
    if (open) void actions.current.refresh();
    const poll = () => { if (document.visibilityState === "visible" || isFalconDesktop()) void actions.current.refresh(!open); };
    const timer = window.setInterval(poll, 30000);
    window.addEventListener("focus", poll); document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(timer); window.removeEventListener("focus", poll); document.removeEventListener("visibilitychange", poll);
    };
  }, [scope, connected, open]);
}
