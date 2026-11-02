import { useEffect, useMemo, useRef, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { getYouTrackConfiguration, saveYouTrackConfiguration } from "../../../application/integrations/getYouTrackIntegrationStatus";
import { canReuseYouTrackToken, configurationInput, draftFromConfiguration, validateYouTrackDraft, type YouTrackConfiguration } from "../../model/youtrack-settings";

type Input = { workspaceId: string; enabled: boolean; onUpdated?: (configuration: YouTrackConfiguration) => void };
/** Toggle only a complete stored workspace connection, preserving its routing and server-held token. */
export function useYouTrackPluginToggle(input: Input) {
  const http = useTmsHttpClient(), session = useOptionalTmsSession();
  const owner = useMemo(() => ({ http, workspaceId: input.workspaceId, enabled: input.enabled, subject: session?.subject }),
    [http, input.workspaceId, input.enabled, session?.subject]);
  const live = useRef<typeof owner | null>(owner); live.current = owner;
  const operation = useRef<{ owner: typeof owner; controller: AbortController } | null>(null);
  const callback = useRef(input.onUpdated); callback.current = input.onUpdated;
  const [state, setState] = useState<{ owner: typeof owner; pending: boolean; error: string | null }>({ owner, pending: false, error: null });
  useEffect(() => {
    live.current = owner;
    return () => {
      if (live.current === owner) live.current = null;
      if (operation.current?.owner === owner) { operation.current.controller.abort(); operation.current = null; }
    };
  }, [owner]);
  const toggle = async (next: boolean): Promise<boolean> => {
    if (!owner.enabled || !owner.workspaceId || live.current !== owner || operation.current?.owner === owner) return false;
    operation.current?.controller.abort();
    const request = { owner, controller: new AbortController() }; operation.current = request;
    const current = () => live.current === owner && operation.current === request && !request.controller.signal.aborted;
    setState({ owner, pending: true, error: null });
    try {
      const loaded = await getYouTrackConfiguration(owner.http, owner.workspaceId, request.controller.signal);
      if (!current()) return false;
      const configuration = loaded.data;
      if (!configuration) return false;
      if (configuration.workspaceId !== owner.workspaceId) throw new TmsApiError("Connection belongs to another workspace.", 409, null, "REMOTE_SCOPE_MISMATCH");
      if (!configuration.baseUrl || !configuration.tokenConfigured || configuration.source !== "workspace" || configuration.configurationVersion !== 2) return false;
      const draft = draftFromConfiguration(configuration); draft.enabled = next;
      if (validateYouTrackDraft(draft, canReuseYouTrackToken(configuration, draft.baseUrl))) return false;
      let accepted = configuration;
      if (configuration.enabled !== next) {
        if (!loaded.etag) throw new TmsApiError("Reload connection settings before changing them.", 428, null, "PRECONDITION_REQUIRED");
        const saved = await saveYouTrackConfiguration(owner.http, owner.workspaceId, configurationInput(draft), loaded.etag, request.controller.signal);
        if (!current()) return false;
        accepted = saved.data;
        if (!accepted || accepted.workspaceId !== owner.workspaceId) throw new TmsApiError("Saved connection belongs to another workspace.", 409, null, "REMOTE_SCOPE_MISMATCH");
      }
      callback.current?.(accepted); return true;
    } catch (error) {
      if (current()) setState({ owner, pending: true, error: error instanceof TmsApiError ? error.code : "SERVICE_UNAVAILABLE" });
      return false;
    } finally {
      if (operation.current === request) operation.current = null;
      if (live.current === owner) setState(value => value.owner === owner ? { ...value, pending: false } : value);
    }
  };
  return { pending: state.owner === owner && state.pending, error: state.owner === owner ? state.error : null, toggle };
}
