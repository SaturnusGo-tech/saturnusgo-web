import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { DashboardAnalyticsQuery } from "../../model/dashboard-analytics";

export type DefectLeadTimePage = components["schemas"]["DashboardDefectLeadTimeEnvelope"];

export function readDashboardDefectLeadTime(http: TmsHttpClient, query: DashboardAnalyticsQuery,
  cursor: string | undefined, signal: AbortSignal) {
  const params = new URLSearchParams({ workspaceId: query.workspaceId, period: query.period, limit: "100" });
  for (const key of ["projectId", "productGroupId", "productId", "regression"] as const) {
    if (query[key] !== undefined) params.set(key, String(query[key]));
  }
  if (cursor) params.set("cursor", cursor);
  return http.get<DefectLeadTimePage>(`/dashboard-analytics/defect-lead-time?${params}`, signal);
}
