import { useEffect, useState } from "react";
import { HISTORY_CHANGE, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { readRepositoryPortfolio, repositoryScopeUrl } from "../navigation/repository-scope";

export function useRepositoryScope(workspaceId: string, projectId: string, active: boolean) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setId(active ? readRepositoryPortfolio(window.location.href, workspaceId) : null);
    read(); window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [workspaceId, active]);
  return { portfolioId: active ? id : null,
    select: (portfolioId: string | null, nextProjectId = projectId) => visitWorkspace(repositoryScopeUrl(window.location.href, workspaceId, nextProjectId, portfolioId)) };
}
