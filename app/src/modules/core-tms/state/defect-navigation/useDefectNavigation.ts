import { useCallback, useEffect, useState } from "react";
import { buildDefectDeepLink, readDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { readWorkspaceDeepLink } from "../navigation/workspace-deep-link";
import { navigateWorkspace } from "../navigation/browser/workspace-history";
import type { View } from "../types/workspace";

export function useDefectNavigation(projectId: string, setView: (view: View) => void, canWriteNavigation: () => boolean) {
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  useEffect(() => {
    const restore = () => {
      const linked = readDefectDeepLink(window.location.href);
      setSelectedDefectId(readWorkspaceDeepLink(window.location.href).view === "reports"
        && (!linked.projectId || linked.projectId === projectId) ? linked.defectId : null);
    };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [projectId]);
  function selectDefect(defectId: string | null) {
    navigateWorkspace(buildDefectDeepLink(window.location.href, { projectId, defectId }));
    setSelectedDefectId(defectId);
  }
  function openDefect(defectId: string) { selectDefect(defectId); setView("reports"); }
  const canonicalizeSelectedDefect = useCallback(() => {
    if (!projectId || !selectedDefectId || !canWriteNavigation()) return;
    const current = new URL(window.location.href);
    const commentId = current.searchParams.get("defectId") === selectedDefectId && current.searchParams.get("projectId") === projectId
      ? current.searchParams.get("commentId") : null;
    navigateWorkspace(buildDefectDeepLink(current.href, { projectId, defectId: selectedDefectId, commentId }), true);
  }, [projectId, selectedDefectId, canWriteNavigation]);
  const clearDefectSelection = useCallback(() => setSelectedDefectId(null), []);
  return { selectedDefectId, setSelectedDefectId: selectDefect, openDefect, canonicalizeSelectedDefect, clearDefectSelection };
}
