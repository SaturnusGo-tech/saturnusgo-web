import { useEffect, useState } from "react";
import type { Activity, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { listCaseHistory } from "../data/case-history-api";
type State = { key: string; items: Activity[]; loading: boolean; error: boolean; nextCursor: string | null };
export function useCaseHistory(testCase: TestCaseSummary | undefined, fallback: Activity[]) {
  const http = useTmsHttpClient();
  const { workspaceId, offline } = useWorkspacePeople();
  const id = testCase?.id, projectId = testCase?.projectId, revision = testCase?.currentRevision;
  const key = `${workspaceId}:${projectId}:${id}:${revision}`;
  const [request, setRequest] = useState({ key, cursor: null as string | null, retry: 0 });
  const [state, setState] = useState<State>({ key, items: [], loading: true, error: false, nextCursor: null });
  const cursor = request.key === key ? request.cursor : null;
  useEffect(() => {
    if (offline || !workspaceId || !id || !projectId) return;
    const controller = new AbortController();
    setState(s => ({ key, items: s.key === key && cursor ? s.items : [], loading: true, error: false, nextCursor: null }));
    void listCaseHistory(http, workspaceId, projectId, id, cursor, controller.signal).then(page => {
      if (controller.signal.aborted) return;
      setState(s => ({ key, items: [...new Map([...(cursor && s.key === key ? s.items : []), ...page.items].map(item => [item.id, item])).values()], loading: false, error: false, nextCursor: page.nextCursor }));
    }).catch(() => {
      if (!controller.signal.aborted) setState(s => ({ ...s, loading: false, error: true }));
    });
    return () => controller.abort();
  }, [http, workspaceId, id, projectId, key, cursor, request.retry, offline]);
  const visible = offline ? { key, items: fallback, loading: false, error: false, nextCursor: null }
    : state.key === key ? state : { key, items: [], loading: true, error: false, nextCursor: null };
  return { ...visible, retry: () => setRequest(r => ({ key, cursor, retry: r.retry + 1 })),
    loadMore: () => { if (!visible.loading && visible.nextCursor) setRequest(r => ({ key, cursor: visible.nextCursor, retry: r.retry })); } };
}
