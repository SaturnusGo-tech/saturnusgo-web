import { useEffect, useState } from "react";
import { HISTORY_CHANGE, navigateWorkspace } from "../../../state/navigation/browser/workspace-history";

type ProjectTab = "overview" | "cases";
export function useProjectTab(projectId: string) {
  const read = (): ProjectTab => {
    if (typeof window === "undefined") return "overview";
    const params = new URL(window.location.href).searchParams;
    return params.get("catalogProjectId") === projectId && params.get("projectTab") === "cases" ? "cases" : "overview";
  };
  const [tab, setTab] = useState<ProjectTab>(read);
  useEffect(() => {
    const restore = () => setTab(read());
    restore(); window.addEventListener("popstate", restore); window.addEventListener(HISTORY_CHANGE, restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener(HISTORY_CHANGE, restore); };
  }, [projectId]);
  return { tab, select(next: ProjectTab) {
    const url = new URL(window.location.href);
    url.searchParams.set("projectTab", next);
    navigateWorkspace(url.href); setTab(next);
  } };
}
