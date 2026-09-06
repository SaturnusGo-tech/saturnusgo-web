import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient, TmsResource } from "../../../../core/tms/transport/http";
import type {
  YouTrackConfiguration,
  YouTrackConfigurationInput,
  YouTrackConnectionTest,
  YouTrackDiscovery,
  YouTrackDisconnectResult,
  YouTrackWebhookSetup,
} from "../model/youtrack-settings";

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

export async function getYouTrackConfiguration(
  http: TmsHttpClient,
  workspaceId: string,
  signal?: AbortSignal,
): Promise<TmsResource<YouTrackConfiguration>> {
  const query = new URLSearchParams({ workspaceId });
  return await http.getResource<YouTrackConfiguration>(
    `/integrations/youtrack/configuration?${query.toString()}`,
    signal,
  );
}

export async function testYouTrackConnection(
  http: TmsHttpClient,
  workspaceId: string,
  input: Readonly<{ baseUrl: string; apiToken?: string }>,
  signal?: AbortSignal,
): Promise<YouTrackConnectionTest> {
  const query = new URLSearchParams({ workspaceId });
  return await http.mutate<YouTrackConnectionTest>(
    `/integrations/youtrack/connection-test?${query.toString()}`,
    "POST",
    input,
    signal,
  );
}

export async function discoverYouTrack(
  http: TmsHttpClient,
  workspaceId: string,
  input: Readonly<{ baseUrl: string; apiToken?: string; projectIds?: readonly string[] }>,
  signal?: AbortSignal,
): Promise<YouTrackDiscovery> {
  const query = new URLSearchParams({ workspaceId });
  return await http.mutate<YouTrackDiscovery>(
    `/integrations/youtrack/discovery?${query.toString()}`,
    "POST",
    input,
    signal,
  );
}

export async function saveYouTrackConfiguration(
  http: TmsHttpClient,
  workspaceId: string,
  input: YouTrackConfigurationInput,
  etag: string,
  signal?: AbortSignal,
): Promise<TmsResource<YouTrackConfiguration>> {
  const query = new URLSearchParams({ workspaceId });
  return await http.mutateResource<YouTrackConfiguration>(
    `/integrations/youtrack/configuration?${query.toString()}`,
    "PATCH",
    input,
    { ifMatch: etag, signal },
  );
}

export async function disconnectYouTrack(
  http: TmsHttpClient,
  workspaceId: string,
  etag: string,
  signal?: AbortSignal,
): Promise<TmsResource<YouTrackDisconnectResult>> {
  const query = new URLSearchParams({ workspaceId });
  return await http.mutateResource<YouTrackDisconnectResult>(
    `/integrations/youtrack/disconnect?${query.toString()}`,
    "POST",
    { mode: "detachExisting" },
    { ifMatch: etag, signal },
  );
}

export async function getYouTrackWebhookSetup(
  http: TmsHttpClient,
  workspaceId: string,
  signal?: AbortSignal,
): Promise<YouTrackWebhookSetup> {
  const query = new URLSearchParams({ workspaceId });
  const envelope = await http.get<components["schemas"]["YouTrackWebhookSetupEnvelope"]>(
    `/integrations/youtrack/webhook-setup?${query.toString()}`,
    signal,
  );
  return envelope.data;
}
