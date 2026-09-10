import { useEffect, useState } from "react";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../../../core/tms/generated/tms-api";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { loadAllWorkspaceProjects } from "../../../../projects/catalog/application/list-projects";

export function useImportProjects(initial: Project, workspaceId?: string) {
  const http = useTmsHttpClient();
  const [catalog, setCatalog] = useState<{ workspaceId: string; projects: Project[] } | null>(null);
  const [selectedId, setSelectedId] = useState(initial.id);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setCatalog(null); setError(false); setSelectedId(initial.id);
    async function load() {
      const scope = workspaceId ?? (await http.getResource<components["schemas"]["Project"]>(
        `/projects/${encodeURIComponent(initial.id)}`, abort.signal)).data.workspaceId;
      const projects = await loadAllWorkspaceProjects(http, scope, abort.signal);
      if (abort.signal.aborted) return;
      setCatalog({ workspaceId: scope, projects });
      setSelectedId(projects.some(p => p.id === initial.id) ? initial.id : projects[0]?.id ?? "");
    }
    void load().catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => abort.abort();
  }, [http, initial.id, workspaceId, revision]);
  return { catalog, project: catalog?.projects.find(p => p.id === selectedId), setSelectedId,
    error, retry: () => setRevision(n => n + 1) };
}
