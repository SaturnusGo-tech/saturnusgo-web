import { useEffect, useMemo, useRef, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { connectorApi } from "../../data/connector-api";
import { connectionDraft } from "../../model/connector-draft";
import { isProvider, type Connection, type Provider } from "../../model/connector-types";
import { useWorkspaceConnectors } from "../context/WorkspaceConnectorContext";

type Input = { workspaceId: string; projectId: string; enabled: boolean; onUpdated?: (provider: Provider, connection: Connection) => void };
export function usePluginConnectionToggle(input: Input) {
  const http = useTmsHttpClient(), session = useOptionalTmsSession(), catalog = useWorkspaceConnectors();
  const owner = useMemo(() => ({ http, workspaceId: input.workspaceId, projectId: input.projectId, enabled: input.enabled,
    subject: session?.subject, update: catalog.update }), [http, input.workspaceId, input.projectId, input.enabled, session?.subject, catalog.update]);
  const live = useRef<typeof owner | null>(owner); live.current = owner;
  const operation = useRef<{ owner: typeof owner; provider: Provider; controller: AbortController } | null>(null);
  const callback = useRef(input.onUpdated); callback.current = input.onUpdated;
  const [state, setState] = useState<{ owner: typeof owner; pending: Provider | null; error: string | null }>({ owner, pending: null, error: null });
  useEffect(() => {
    live.current = owner;
    return () => {
      if (live.current === owner) live.current = null;
      if (operation.current?.owner === owner) { operation.current.controller.abort(); operation.current = null; }
    };
  }, [owner]);
  const toggle = async (provider: Provider, next: boolean): Promise<boolean> => {
    if (!owner.enabled || !owner.workspaceId || !owner.projectId || !isProvider(provider) || live.current !== owner) return false;
    if (operation.current?.owner === owner) return false;
    operation.current?.controller.abort();
    const request = { owner, provider, controller: new AbortController() }; operation.current = request;
    const current = () => live.current === owner && operation.current === request && !request.controller.signal.aborted;
    setState({ owner, pending: provider, error: null });
    try {
      const api = connectorApi(owner.http), scope = { workspaceId: owner.workspaceId, projectId: owner.projectId };
      const loaded = await api.configuration(scope, provider, request.controller.signal);
      if (!current()) return false;
      const connection = loaded.data;
      if (!connection) return false;
      if (connection.workspaceId !== scope.workspaceId || connection.projectId !== scope.projectId || connection.provider !== provider)
        throw new TmsApiError("Connection belongs to another scope.", 409, null, "REMOTE_SCOPE_MISMATCH");
      let accepted = connection;
      if (connection.enabled !== next) {
        if (!loaded.etag) throw new TmsApiError("Reload connection settings before changing them.", 428, null, "PRECONDITION_REQUIRED");
        const draft = connectionDraft(provider, connection); draft.enabled = next;
        const saved = await api.save(scope, provider, draft, loaded.etag, request.controller.signal);
        if (!current()) return false;
        accepted = saved.data;
        if (accepted.workspaceId !== scope.workspaceId || accepted.projectId !== scope.projectId || accepted.provider !== provider)
          throw new TmsApiError("Saved connection belongs to another scope.", 409, null, "REMOTE_SCOPE_MISMATCH");
      }
      owner.update(scope, provider, accepted); callback.current?.(provider, accepted);
      return true;
    } catch (error) {
      if (current()) setState({ owner, pending: provider, error: error instanceof TmsApiError ? error.code : "SERVICE_UNAVAILABLE" });
      return false;
    } finally {
      if (operation.current === request) operation.current = null;
      if (live.current === owner) setState(value => value.owner === owner ? { ...value, pending: null } : value);
    }
  };
  return { pending: state.owner === owner ? state.pending : null, error: state.owner === owner ? state.error : null, toggle };
}
