import { useEffect, useState } from "react";
import { HISTORY_CHANGE, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { readApiContext, apiContextUrl } from "./api-context";
import type { ApiContext } from "../model/api-source";
export function useApiContext(projectId: string) {
  const [context, setContext] = useState<ApiContext>(() => typeof window === "undefined" ? { projectIds: [projectId] } : readApiContext(window.location.href, projectId));
  useEffect(() => {
    const read = () => setContext(readApiContext(window.location.href, projectId)); read();
    window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [projectId]);
  return { context, select: (value: ApiContext) => visitWorkspace(apiContextUrl(window.location.href, value)) };
}
