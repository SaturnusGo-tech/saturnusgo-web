import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import {
  getYouTrackIntegrationStatus as getStatusResource,
  type YouTrackIntegrationStatus,
} from "../../youtrack/data/youtrack-api";

export type { YouTrackIntegrationStatus };

export function getYouTrackIntegrationStatus(
  http: TmsHttpClient,
  workspaceId: string,
  signal?: AbortSignal,
): Promise<YouTrackIntegrationStatus> {
  return getStatusResource(http, workspaceId, signal);
}
