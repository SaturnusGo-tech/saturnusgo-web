import { useCallback, useEffect, useRef, useState } from "react";
import type { CodexEmployee, CodexEmployeePort, PersonalCodexConnection } from "../../domain/model/codex-employee";
type State = {
    owner: CodexEmployeePort;
    employee: CodexEmployee | null;
    connections: readonly PersonalCodexConnection[];
    loading: boolean;
    pending: boolean;
    error: string | null;
    connectionsError: string | null;
};
const empty = (owner: CodexEmployeePort): State => ({ owner, employee: null, connections: [], loading: true, pending: false, error: null, connectionsError: null });
const errorCode = (error: unknown) => error && typeof error === "object" && "code" in error ? String(error.code) : "SERVICE_UNAVAILABLE";
export function useCodexEmployee(api: CodexEmployeePort, enabled = true, options: { connections?: boolean } = {}) {
    const includeConnections = options.connections !== false;
    const [state, setState] = useState(() => empty(api));
    const [version, setVersion] = useState(0);
    const active = useRef<AbortController | null>(null);
    const mutation = useRef<AbortController | null>(null);
    const owner = useRef(api);
    owner.current = api;
    useEffect(() => {
        const controller = new AbortController();
        active.current = controller;
        setState(current => current.owner === api ? { ...current, loading: !current.employee, error: null, connectionsError: null } : empty(api));
        if (!enabled) {
            setState({ ...empty(api), loading: false });
            return () => controller.abort();
        }
        void Promise.allSettled([api.status(controller.signal), includeConnections ? api.connections(controller.signal) : Promise.resolve([])]).then(([employee, connections]) => {
            if (controller.signal.aborted)
                return;
            setState({ owner: api, employee: employee.status === "fulfilled" ? employee.value : null,
                connections: connections.status === "fulfilled" ? connections.value : [], loading: false, pending: false,
                error: employee.status === "rejected" ? errorCode(employee.reason) : null,
                connectionsError: connections.status === "rejected" ? errorCode(connections.reason) : null });
        });
        return () => { controller.abort(); mutation.current?.abort(); mutation.current = null; };
    }, [api, enabled, includeConnections, version]);
    const refresh = useCallback(() => setVersion(value => value + 1), []);
    const mutate = async (operation: (signal: AbortSignal) => Promise<void>) => {
        if (mutation.current || owner.current !== api || !enabled)
            return;
        const controller = new AbortController();
        mutation.current = controller;
        setState(current => ({ ...current, pending: true, error: null }));
        try {
            await operation(controller.signal);
            if (!controller.signal.aborted && owner.current === api)
                refresh();
        }
        catch (error) {
            if (!controller.signal.aborted && owner.current === api)
                setState(current => ({ ...current, pending: false, error: errorCode(error) }));
        }
        finally {
            if (mutation.current === controller)
                mutation.current = null;
        }
    };
    const current = state.owner === api ? state : empty(api);
    return { employee: current.employee, connections: current.connections, loading: current.loading, pending: current.pending, error: current.error, connectionsError: current.connectionsError, refresh,
        deactivate: async () => { const employee = current.employee; if (employee?.canDeactivate)
            await mutate(signal => api.deactivate(employee, crypto.randomUUID(), signal)); },
        revoke: async (grantId: string) => { if (current.connections.some(row => row.id === grantId && !row.revokedAt))
            await mutate(signal => api.revoke(grantId, signal)); },
    };
}
