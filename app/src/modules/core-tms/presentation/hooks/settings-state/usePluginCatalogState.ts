import { useCallback, useEffect, useMemo, useState } from "react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getYouTrackConfiguration, getYouTrackIntegrationStatus, type YouTrackIntegrationStatus } from "../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackConfiguration } from "../../../youtrack/model/youtrack-settings";
import { useApiSourceList } from "../../../api-sources/state/useApiSourceList";
import { useWorkspaceConnectors } from "../../../connectors/application/context/WorkspaceConnectorContext";

export function usePluginCatalogState(workspaceId: string, projectId: string, enabled: boolean, apiEnabled: boolean) {
  const http = useTmsHttpClient(), connectors = useWorkspaceConnectors(), session = useOptionalTmsSession();
  const [version, setVersion] = useState(0);
  const owner = useMemo(() => ({ http, workspaceId, enabled, version, subject: session?.subject }), [http, workspaceId, enabled, version, session?.subject]);
  const [result, setResult] = useState<{ owner: typeof owner; configuration: YouTrackConfiguration | null; status: YouTrackIntegrationStatus | null; failed: boolean }>({ owner, configuration: null, status: null, failed: false });
  const sources = useApiSourceList(workspaceId, { projectIds: [projectId] }, false, apiEnabled);
  useEffect(() => {
    const controller = new AbortController();
    if (enabled) void Promise.all([getYouTrackConfiguration(http, workspaceId, controller.signal), getYouTrackIntegrationStatus(http, workspaceId, controller.signal)])
      .then(([configuration, status]) => { if (!controller.signal.aborted) setResult({ owner, configuration: configuration.data, status, failed: false }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ owner, configuration: null, status: null, failed: true }); });
    return () => controller.abort();
  }, [http, workspaceId, enabled, owner]);
  const refresh = useCallback(() => { setVersion(value => value + 1); connectors.refresh(); sources.refresh(); }, [connectors.refresh, sources.refresh]);
  const current = result.owner === owner ? result : { configuration: null, status: null, failed: false };
  return { configuration: current.configuration, status: current.status, statusFailed: current.failed,
    connectorState: connectors.state, connections: connectors.connections, refresh,
    swaggerStatus: (!apiEnabled ? "available" : sources.loading ? "checking" : sources.error ? "attention" : sources.items.some(source => source.enabled) ? "connected" : "available") as "available" | "checking" | "attention" | "connected" };
}
