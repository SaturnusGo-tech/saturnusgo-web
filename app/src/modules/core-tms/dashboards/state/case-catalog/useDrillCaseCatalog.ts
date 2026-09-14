import { useEffect, useState } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listTestCases } from "../../../test-cases/data/test-case-api";
import { listFolders } from "../../../folders/data/folder-api";
import type { RepositoryFolder } from "../../../folders/model/folder";

type Catalog = Record<string, { cases: TestCaseSummary[]; folders: RepositoryFolder[] }>;
export function useDrillCaseCatalog(workspaceId: string, projectIds: string[]) {
  const http = useTmsHttpClient();
  const scope = JSON.stringify([...projectIds].sort());
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ scope: string; catalog: Catalog; loading: boolean; error: boolean }>({ scope: "", catalog: {}, loading: true, error: false });
  useEffect(() => {
    const controller = new AbortController();
    setState({ scope, catalog: {}, loading: true, error: false });
    void Promise.all((JSON.parse(scope) as string[]).map(async (projectId) => {
      const [cases, folders] = await Promise.all([listTestCases(http, projectId, controller.signal),
        listFolders(http, { workspaceId, projectId }, controller.signal)]);
      return [projectId, { cases: cases.items, folders }] as const;
    })).then((entries) => {
      if (!controller.signal.aborted) setState({ scope, catalog: Object.fromEntries(entries), loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ scope, catalog: {}, loading: false, error: true });
    });
    return () => controller.abort();
  }, [http, workspaceId, scope, attempt]);
  return { catalog: state.scope === scope ? state.catalog : {}, loading: state.scope !== scope || state.loading,
    error: state.scope === scope && state.error, retry: () => setAttempt((value) => value + 1) };
}
