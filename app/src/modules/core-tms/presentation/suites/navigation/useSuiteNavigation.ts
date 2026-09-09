import { useCallback, useEffect, useState } from "react";
import { buildSuiteRoute, readSuiteRoute } from "../../../suites/navigation/suite-route";

export function useSuiteNavigation(workspaceId: string, projectId: string, onSelect: (id: string) => void) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const next = readSuiteRoute(window.location.href, workspaceId, projectId);
      setId(next);
      if (next) onSelect(next);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [workspaceId, projectId, onSelect]);
  const navigate = useCallback((next: string | null) => {
    const href = buildSuiteRoute(window.location.href, workspaceId, projectId, next);
    if (href !== window.location.href) window.history.pushState(null, "", href);
    setId(next);
    if (next) onSelect(next);
  }, [workspaceId, projectId, onSelect]);
  return { id, open: navigate, back: () => navigate(null) };
}
