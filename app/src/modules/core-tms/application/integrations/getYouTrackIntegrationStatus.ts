import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import {
  getYouTrackConfiguration as getConfigurationResource,
  getYouTrackIntegrationStatus as getStatusResource,
  saveYouTrackConfiguration as saveConfigurationResource,
  testYouTrackConnection as testConnectionResource,
  type YouTrackIntegrationStatus,
} from "../../youtrack/data/youtrack-api";
import type { TmsResource } from "../../../../core/tms/transport/http";
import type {
  YouTrackConfiguration,
  YouTrackConfigurationInput,
  YouTrackConnectionTest,
} from "../../youtrack/model/youtrack-settings";

export type { YouTrackIntegrationStatus };

export function getYouTrackIntegrationStatus(
  http: TmsHttpClient,
  workspaceId: string,
  signal?: AbortSignal,
): Promise<YouTrackIntegrationStatus> {
  return getStatusResource(http, workspaceId, signal);
}

export function getYouTrackConfiguration(
  http: TmsHttpClient,
  workspaceId: string,
  signal?: AbortSignal,
): Promise<TmsResource<YouTrackConfiguration>> {
  return getConfigurationResource(http, workspaceId, signal);
}

export function testYouTrackConnection(
  http: TmsHttpClient,
  workspaceId: string,
  input: Readonly<{ baseUrl: string; apiToken?: string }>,
  signal?: AbortSignal,
): Promise<YouTrackConnectionTest> {
  return testConnectionResource(http, workspaceId, input, signal);
}

export function saveYouTrackConfiguration(
  http: TmsHttpClient,
  workspaceId: string,
  input: YouTrackConfigurationInput,
  etag: string,
  signal?: AbortSignal,
): Promise<TmsResource<YouTrackConfiguration>> {
  return saveConfigurationResource(http, workspaceId, input, etag, signal);
}
