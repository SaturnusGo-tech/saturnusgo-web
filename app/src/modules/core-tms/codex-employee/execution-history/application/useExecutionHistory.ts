import { useCallback, useEffect, useRef, useState } from "react";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { ExecutionHistoryEvent, ExecutionHistoryScope } from "../domain/execution-history";
import { listExecutionHistory } from "../data/execution-history-api";
type State = {
    key: string;
    owner: TmsHttpClient;
    items: readonly ExecutionHistoryEvent[];
    nextCursor: string | null;
    loading: boolean;
    pending: boolean;
    error: boolean;
};
const empty = (owner: TmsHttpClient, key: string, enabled: boolean): State => ({ owner, key, items: [], nextCursor: null, loading: enabled, pending: false, error: false });
export function useExecutionHistory(http: TmsHttpClient, scope: ExecutionHistoryScope, enabled: boolean, version?: number) {
    const key = JSON.stringify([scope.workspaceId, scope.projectId, scope.runId, scope.itemId, scope.attemptNo ?? null, scope.stepId ?? null, version, enabled]);
    const [state, setState] = useState(() => empty(http, key, enabled));
    const [reload, setReload] = useState(0);
    const active = useRef<AbortController | null>(null);
    const current = useRef({ key, http, enabled });
    current.current = { key, http, enabled };
    useEffect(() => {
        const controller = new AbortController();
        active.current = controller;
        setState(empty(http, key, enabled));
        if (enabled)
            void listExecutionHistory(http, scope, null, controller.signal).then(page => {
                if (!controller.signal.aborted)
                    setState({ owner: http, key, ...page, loading: false, pending: false, error: false });
            }).catch(() => { if (!controller.signal.aborted)
                setState({ ...empty(http, key, false), error: true }); });
        return () => { controller.abort(); active.current?.abort(); };
    }, [http, key, enabled, reload]);
    const refresh = useCallback(() => setReload(value => value + 1), []);
    const visible = state.key === key && state.owner === http ? state : empty(http, key, enabled);
    const more = async () => {
        if (!visible.nextCursor || visible.pending || !enabled)
            return;
        active.current?.abort();
        const controller = new AbortController();
        active.current = controller;
        setState({ ...visible, pending: true, error: false });
        try {
            const page = await listExecutionHistory(http, scope, visible.nextCursor, controller.signal);
            if (!controller.signal.aborted && current.current.key === key && current.current.http === http)
                setState({ ...visible, items: [...visible.items, ...page.items.filter(event => !visible.items.some(old => old.id === event.id))], nextCursor: page.nextCursor, pending: false });
        }
        catch (error) {
            if (!controller.signal.aborted && current.current.key === key && current.current.http === http) {
                const denied = error instanceof TmsApiError && [401,403,404].includes(error.status);
                setState({ ...(denied ? empty(http,key,false) : visible), pending: false, error: true });
            }
        }
    };
    return { ...visible, refresh, more };
}
