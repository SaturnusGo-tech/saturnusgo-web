import { isProjectCaseContext } from "../../../test-cases/navigation/project/project-case-context";
import { useCallback, useEffect, useRef } from "react";
import { readWorkspaceDeepLink } from "../workspace-deep-link";
import { readCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import { WorkspaceNavigationRestoration } from "../restoration/workspace-navigation-restoration";
import { initializeWorkspaceHistory, navigateWorkspace } from "./workspace-history";
import type { View } from "../../types/workspace";

type Selection = { workspaceId: string; projectId: string; view: View; runId: string | null; caseId: string };
type Input = Selection & {
  ready: boolean; setView: (view: View) => void; setCase: (id: string) => void;
  setRun: (id: string | null) => void; setItem: (id: string | null) => void;
  closeDialog: () => void; reload: () => void;
};
export function useWorkspaceHistory(input: Input) {
  const latest = useRef(input); latest.current = input;
  const restoration = useRef(new WorkspaceNavigationRestoration());
  const replace = useRef(true);
  const begin = useCallback((selection: Selection) => { replace.current = true; restoration.current.begin(selection); }, []);
  const navigateView = useCallback((view: View) => { replace.current = false; restoration.current.cancel(); latest.current.setView(view); }, []);
  const canWrite = useCallback(() => restoration.current.canWrite(input), [input.workspaceId, input.projectId, input.view, input.runId, input.caseId]);
  const write = useCallback((href: string) => { const current = new URL(window.location.href); const next = new URL(href);
    const resolvingFirstItem = current.searchParams.get("view") === "runs" && next.searchParams.get("view") === "runs"
      && current.searchParams.get("projectId") === next.searchParams.get("projectId")
      && current.searchParams.get("runId") === next.searchParams.get("runId") && !current.searchParams.has("runItemId");
    navigateWorkspace(href, replace.current || resolvingFirstItem); replace.current = false; }, []);
  useEffect(() => {
    if (!input.ready) return;
    initializeWorkspaceHistory();
    const restore = () => {
      const current = latest.current; const linked = readCaseDeepLink(window.location.href);
      const target = readWorkspaceDeepLink(window.location.href);
      const workspaceId = new URL(window.location.href).searchParams.get("workspaceId") ?? current.workspaceId;
      const projectId = linked.projectId ?? current.projectId;
      const view = target.view ?? "cases";
      const caseId = view === "cases" || isProjectCaseContext(window.location.href, projectId) ? linked.caseId ?? "" : "";
      // Guard URL effects before updating React, including asynchronous project reloads.
      begin({ workspaceId, projectId, view, runId: target.runId, caseId });
      // Scope-only URL changes may not update any selection state or trigger URL effects.
      restoration.current.canWrite(current);
      current.closeDialog();
      if (workspaceId !== current.workspaceId || projectId !== current.projectId) { current.reload(); return; }
      current.setView(view); current.setCase(caseId); current.setRun(target.runId); current.setItem(target.runItemId ?? null);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [input.ready, begin]);
  return { begin, navigateView, canWrite, write };
}
