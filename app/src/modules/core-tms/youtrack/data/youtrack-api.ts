import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";

export type YouTrackIntegrationStatus = components["schemas"]["YouTrackIntegrationStatus"];

export async function getYouTrackIntegrationStatus(
  http: TmsHttpClient,
  workspaceId: string,
  signal?: AbortSignal,
): Promise<YouTrackIntegrationStatus> {
  const query = new URLSearchParams({ workspaceId });
  const envelope = await http.get<components["schemas"]["YouTrackIntegrationStatusEnvelope"]>(
    `/integrations/youtrack/status?${query.toString()}`,
    signal,
  );
  return envelope.data;
}
