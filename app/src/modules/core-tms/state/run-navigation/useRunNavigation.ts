import { useCallback } from "react";
import type { View } from "../types/workspace";
import { openRunNavigation } from "./open-run-navigation";

export function useRunNavigation(input: {
  workspaceId: string; projectId: string;
  setSelectedRunId: (id: string | null) => void;
  setSelectedRunItemId: (id: string | null) => void;
  setView: (view: View) => void;
  clearDefectSelection: () => void;
}) {
  return useCallback((runId: string, runItemId: string | null = null) => {
    openRunNavigation({ workspaceId: input.workspaceId, projectId: input.projectId, runId, runItemId }, {
      href: window.location.href,
      replace: (href) => window.history.replaceState(window.history.state, "", href),
      clearDefect: input.clearDefectSelection,
      selectRun: input.setSelectedRunId,
      selectItem: input.setSelectedRunItemId,
      showRuns: () => input.setView("runs"),
    });
  }, [input.workspaceId, input.projectId, input.setSelectedRunId, input.setSelectedRunItemId,
    input.setView, input.clearDefectSelection]);
}
