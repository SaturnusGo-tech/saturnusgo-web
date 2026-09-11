import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
export type RunAssignmentRequest = components["schemas"]["RunAssignmentRequest"];
export async function assignRunItems(http: TmsHttpClient, workspaceId: string, body: RunAssignmentRequest, key: string) {
  return http.mutateResource<components["schemas"]["RunAssignmentEnvelope"]["data"]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/run-assignments`, "POST", body, { idempotencyKey:key });
}
