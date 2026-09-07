import { useCallback, useEffect, useRef, useState } from "react";
import { buildDefectDeepLink, readDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { readWorkspaceDeepLink } from "../navigation/workspace-deep-link";
import type { View } from "../types/workspace";

export function useDefectNavigation(
  projectId: string,
  setView: (view: View) => void,
  canWriteNavigation: () => boolean,
) {
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const initializedProject = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId || initializedProject.current === projectId || !canWriteNavigation()) return;
    const firstProject = initializedProject.current === null;
    initializedProject.current = projectId;
    if (firstProject) {
      const linked = readDefectDeepLink(window.location.href);
      if (readWorkspaceDeepLink(window.location.href).view === "reports"
        && (!linked.projectId || linked.projectId === projectId) && linked.defectId) {
        setSelectedDefectId(linked.defectId);
        if (linked.projectId) {
          const next = buildDefectDeepLink(window.location.href, {
            projectId, defectId: linked.defectId,
          });
          if (next !== window.location.href) window.history.replaceState(null, "", next);
        }
        setView("reports");
        return;
      }
    } else {
      const next = buildDefectDeepLink(window.location.href, { projectId, defectId: null });
      if (next !== window.location.href) window.history.replaceState(null, "", next);
    }
    setSelectedDefectId(null);
  }, [projectId, setView, canWriteNavigation]);

  function selectDefect(defectId: string | null) {
    setSelectedDefectId(defectId);
    const next = buildDefectDeepLink(window.location.href, { projectId, defectId });
    if (next !== window.location.href) window.history.replaceState(null, "", next);
  }

  function openDefect(defectId: string) {
    selectDefect(defectId);
    setView("reports");
  }

  const canonicalizeSelectedDefect = useCallback(() => {
    if (!projectId || !selectedDefectId) return;
    const next = buildDefectDeepLink(window.location.href, {
      projectId, defectId: selectedDefectId,
    });
    if (next !== window.location.href) window.history.replaceState(null, "", next);
  }, [projectId, selectedDefectId]);
  const clearDefectSelection = useCallback(() => setSelectedDefectId(null), []);

  return {
    selectedDefectId, setSelectedDefectId: selectDefect, openDefect,
    canonicalizeSelectedDefect, clearDefectSelection,
  };
}
