import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listProjectCatalog } from "../../../projects/catalog/data/project-catalog-api";
import type { NamedOption } from "../../model/api-source";
export function useApiProjects(workspaceId: string) {
  const http = useTmsHttpClient(); const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ items: NamedOption[]; loading: boolean; error: boolean }>({ items: [], loading: true, error: false });
  useEffect(() => {
    const controller = new AbortController(); setState({ items: [], loading: true, error: false });
    void (async () => {
      const items: NamedOption[] = []; let cursor: string | null = null;
      do {
        const page = await listProjectCatalog(http, { workspaceId, status: "active" }, cursor, controller.signal);
        items.push(...page.items); cursor = page.nextCursor;
      } while (cursor);
      if (!controller.signal.aborted) setState({ items, loading: false, error: false });
    })().catch(() => { if (!controller.signal.aborted) setState({ items: [], loading: false, error: true }); });
    return () => controller.abort();
  }, [http, workspaceId, revision]);
  return { ...state, retry: () => setRevision(value => value + 1) };
}
