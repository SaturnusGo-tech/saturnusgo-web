import { useEffect, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { requestWorkspaceActor } from "../../data/actors/request-workspace-actor";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
export function useWorkspaceActor(workspaceId: string, identityId: string | null, offline = false,
    supplied?: WorkspaceActor | null, { includeSignIn = false }: { includeSignIn?: boolean } = {}) {
    const http = useOptionalTmsHttpClient();
    const scope = JSON.stringify([workspaceId, identityId, offline, includeSignIn]);
    const enabled = Boolean(http && workspaceId && identityId && !offline && supplied === undefined);
    const [state, setState] = useState<{
        scope: string;
        actor: WorkspaceActor | null;
        loading: boolean;
    }>({ scope, actor: null, loading: enabled });
    useEffect(() => {
        const controller = new AbortController();
        setState({ scope, actor: null, loading: enabled });
        if (enabled && http && identityId)
            void requestWorkspaceActor(http, workspaceId, identityId, controller.signal, includeSignIn)
                .then(actor => { if (!controller.signal.aborted)
                setState({ scope, actor, loading: false }); })
                .catch(() => { if (!controller.signal.aborted)
                setState({ scope, actor: null, loading: false }); });
        return () => controller.abort();
    }, [http, workspaceId, identityId, offline, enabled, includeSignIn]);
    if (supplied !== undefined)
        return { actor: supplied, loading: false };
    return state.scope === scope ? state : { scope, actor: null, loading: enabled };
}
