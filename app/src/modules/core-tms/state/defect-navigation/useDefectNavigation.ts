import { useCallback, useEffect, useState } from "react";
import { buildDefectDeepLink, readDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { readWorkspaceDeepLink } from "../navigation/workspace-deep-link";
import { navigateWorkspace } from "../navigation/browser/workspace-history";
import type { View } from "../types/workspace";
import { requestAuthoringLeave } from "../../authoring/leave/application/authoring-leave";

export function useDefectNavigation(projectId: string, setView: (view: View) => void, canWriteNavigation: () => boolean) {
  const [selection, setSelection] = useState<{ defectId: string; includeArchived: boolean } | null>(null);
  const selectedDefectId = selection?.defectId ?? null;
  const selectedDefectIncludesArchived = selection?.includeArchived ?? false;
  useEffect(() => {
    const restore = () => {
      const linked = readDefectDeepLink(window.location.href);
      setSelection(linked.defectId && readWorkspaceDeepLink(window.location.href).view === "reports"
        && (!linked.projectId || linked.projectId === projectId)
        ? { defectId: linked.defectId, includeArchived: linked.includeArchived ?? false } : null);
    };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [projectId]);
  function applySelection(defectId: string | null, includeArchived = false) {
    navigateWorkspace(buildDefectDeepLink(window.location.href, { projectId, defectId, includeArchived }));
    setSelection(defectId ? { defectId, includeArchived } : null);
  }
  function selectDefect(defectId: string | null, includeArchived = false) {
    void requestAuthoringLeave(() => applySelection(defectId, includeArchived));
  }
  function openDefect(defectId: string, includeArchived = false) {
    void requestAuthoringLeave(() => { applySelection(defectId, includeArchived); setView("reports"); });
  }
  const canonicalizeSelectedDefect = useCallback(() => {
    if (!projectId || !selectedDefectId || !canWriteNavigation()) return;
    const current = new URL(window.location.href);
    const commentId = current.searchParams.get("defectId") === selectedDefectId && current.searchParams.get("projectId") === projectId
      ? current.searchParams.get("commentId") : null;
    navigateWorkspace(buildDefectDeepLink(current.href, {
      projectId, defectId: selectedDefectId, commentId, includeArchived: selectedDefectIncludesArchived,
    }), true);
  }, [projectId, selectedDefectId, selectedDefectIncludesArchived, canWriteNavigation]);
  const clearDefectSelection = useCallback(() => setSelection(null), []);
  return { selectedDefectId, selectedDefectIncludesArchived, setSelectedDefectId: selectDefect,
    openDefect, canonicalizeSelectedDefect, clearDefectSelection };
}
