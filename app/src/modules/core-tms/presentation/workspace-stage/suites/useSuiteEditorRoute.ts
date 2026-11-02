import { useCallback, useEffect, useState } from "react";
import { buildSuiteEditorRoute, buildSuiteRoute, readSuiteEditorRoute, readSuiteRoute } from "../../../suites/navigation/suite-route";
import { HISTORY_CHANGE, navigateWorkspace } from "../../../state/navigation/browser/workspace-history";

export function useSuiteEditorRoute(workspaceId: string, projectId: string) {
  const read = useCallback(() => {
    const href = typeof window === "undefined" ? "https://falcon.invalid" : window.location.href;
    return { mode: readSuiteEditorRoute(href, workspaceId, projectId), id: readSuiteRoute(href, workspaceId, projectId) };
  }, [workspaceId, projectId]);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const sync = () => setRoute(read());
    sync(); window.addEventListener("popstate", sync); window.addEventListener(HISTORY_CHANGE, sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener(HISTORY_CHANGE, sync); };
  }, [read]);
  const open = (id: string | null) => navigateWorkspace(buildSuiteEditorRoute(window.location.href, workspaceId, projectId, id));
  const show = (id: string | null) => navigateWorkspace(buildSuiteRoute(window.location.href, workspaceId, projectId, id));
  return { ...route, open, show, close: () => show(route.mode === "edit" ? route.id : null) };
}
