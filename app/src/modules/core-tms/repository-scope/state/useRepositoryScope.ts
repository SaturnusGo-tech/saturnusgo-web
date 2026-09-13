import { useEffect, useState } from "react";
import { HISTORY_CHANGE, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { readRepositorySelection, repositoryScopeUrl } from "../navigation/repository-scope";

export function useRepositoryScope(workspaceId: string, projectId: string, active: boolean) {
  const [selection, setSelection] = useState<{ portfolioIds: string[]; projectIds: string[] }>({ portfolioIds: [], projectIds: [] });
  useEffect(() => {
    const read = () => setSelection(active ? readRepositorySelection(window.location.href, workspaceId) : { portfolioIds: [], projectIds: [] });
    read(); window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [workspaceId, active]);
  const portfolioIds = active ? selection.portfolioIds : [];
  const projectIds = active ? selection.projectIds : [];
  const portfolioId = portfolioIds[0] ?? null;
  return { portfolioId, portfolioIds, projectIds, aggregate: !!portfolioId || projectIds.length > 1,
    key: `${workspaceId}:portfolios:${portfolioIds.join(",")}:projects:${projectIds.join(",")}`,
    select: (id: string | null, nextProjectId = projectId) => visitWorkspace(repositoryScopeUrl(window.location.href, workspaceId, nextProjectId, id)),
    selectMany: (kind: "projects" | "portfolios", ids: string[], nextProjectId = projectId) => {
      if (!ids.length) return;
      visitWorkspace(repositoryScopeUrl(window.location.href, workspaceId, nextProjectId, null,
        { portfolioIds: kind === "portfolios" ? ids : [], projectIds: kind === "projects" && ids.length > 1 ? ids : [] }));
    } };
}
