import { useCallback, useEffect, useRef, useState } from "react";
import { buildDefectDeepLink, readDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import type { View } from "../types/workspace";

export function useDefectNavigation(
  projectId: string,
  setView: (view: View) => void,
) {
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    if (!initialized.current) {
      initialized.current = true;
      const linked = readDefectDeepLink(window.location.href);
      if ((!linked.projectId || linked.projectId === projectId) && linked.defectId) {
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
  }, [projectId, setView]);

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

  return {
    selectedDefectId, setSelectedDefectId: selectDefect, openDefect,
    canonicalizeSelectedDefect,
  };
}
