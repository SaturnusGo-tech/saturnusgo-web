import { useEffect, useState } from "react";

import { getYouTrackWebhookSetup } from "../../../../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsHttpClient } from "../../../../../auth/http/TmsHttpClientContext";
import type {
  YouTrackConfiguration,
  YouTrackWebhookSetup,
} from "../../../../../youtrack/model/youtrack-settings";

export function useYouTrackWebhookSetup(
  workspaceId: string,
  configuration: YouTrackConfiguration | null,
  canManage: boolean,
) {
  const http = useTmsHttpClient();
  const [setup, setSetup] = useState<YouTrackWebhookSetup | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");

  useEffect(() => {
    const configured = canManage && Boolean(configuration?.baseUrl)
      && Boolean(configuration?.tokenConfigured) && configuration?.connection.status !== "unconfigured";
    if (!configured) { setSetup(null); setStatus("idle"); return; }
    const controller = new AbortController();
    setSetup(null); setStatus("loading");
    void getYouTrackWebhookSetup(http, workspaceId, controller.signal)
      .then((value) => { if (!controller.signal.aborted) { setSetup(value); setStatus("ready"); } })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("unavailable");
      });
    return () => controller.abort();
  }, [canManage, configuration?.baseUrl, configuration?.connection.status,
    configuration?.connectionRevision, configuration?.rowVersion, configuration?.tokenConfigured, http, workspaceId]);

  return { setup, status } as const;
}
