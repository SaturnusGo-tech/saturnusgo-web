import { useEffect } from "react";
export function useCaseActivityNavigation(projectId: string | undefined, caseId: string | undefined,
  setTab: (tab: "overview" | "files" | "activity") => void) {
  useEffect(() => {
    const restore = () => {
      const query = new URL(window.location.href).searchParams;
      if (query.get("projectId") === projectId && query.get("caseId") === caseId
        && query.get("caseTab") === "activity") setTab("activity");
    };
    restore();
    window.addEventListener("popstate", restore); window.addEventListener("falcon:navigation", restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("falcon:navigation", restore); };
  }, [projectId, caseId, setTab]);
}
