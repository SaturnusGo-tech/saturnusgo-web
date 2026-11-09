import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { DashboardDefectBreakdownRequest } from "../../model/breakdown/dashboard-defect-breakdown";

export async function readDashboardDefectBreakdown(http: TmsHttpClient,
  { query, basis, groupBy, segmentBy, hasLink }: DashboardDefectBreakdownRequest, signal?: AbortSignal) {
  const params = new URLSearchParams({ workspaceId: query.workspaceId, period: query.period,
    basis, groupBy, segmentBy });
  for (const key of ["projectId", "productGroupId", "productId", "regression"] as const) {
    if (query[key] !== undefined) params.set(key, String(query[key]));
  }
  if (hasLink !== undefined) params.set("hasLink", String(hasLink));
  const envelope = await http.get<components["schemas"]["DashboardDefectBreakdownEnvelope"]>(
    `/dashboard-analytics/defect-breakdown?${params}`, signal);
  return envelope.data;
}
