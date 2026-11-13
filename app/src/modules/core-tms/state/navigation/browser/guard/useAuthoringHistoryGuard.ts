import { useEffect } from "react";
import { authoringLeave, requestAuthoringLeave } from "../../../../authoring/leave/application/authoring-leave";
import { navigationEntry } from "../../history/history";
import { HISTORY_CHANGE, initializeWorkspaceHistory } from "../workspace-history";
import { AuthoringHistoryGuard } from "./authoring-history-guard";

export function useAuthoringHistoryGuard() {
  useEffect(() => {
    initializeWorkspaceHistory();
    const guard = new AuthoringHistoryGuard({
      read: () => { const state = window.history.state; const entry = navigationEntry(state);
        return { href: window.location.href, state, index: entry?.index, session: entry?.session }; },
      changed: () => authoringLeave.hasChanges(), go: delta => window.history.go(delta),
      replace: position => window.history.replaceState(position.state, "", position.href),
      dispatch: () => window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state })),
      request: requestAuthoringLeave,
    });
    const capture = (event: PopStateEvent) => guard.capture(event);
    const record = () => guard.record();
    window.addEventListener("popstate", capture, true);
    window.addEventListener(HISTORY_CHANGE, record);
    return () => { window.removeEventListener("popstate", capture, true); window.removeEventListener(HISTORY_CHANGE, record); };
  }, []);
}
