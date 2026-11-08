import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapDashboardAnalyticsSummary } from "../../http/dashboard-summary-mapper";
import type { DashboardAnalyticsQuery } from "../../model/dashboard-analytics";

export async function readDashboardSummary(http: TmsHttpClient, query: DashboardAnalyticsQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ workspaceId: query.workspaceId, period: query.period, dimensionLimit: "20" });
  if (query.projectId) params.set("projectId", query.projectId);
  for (const key of ["productGroupId", "productId", "regression"] as const) {
    if (query[key] !== undefined) params.set(key, String(query[key]));
  }
  const { data } = await http.get<components["schemas"]["DashboardAnalyticsSummaryEnvelope"]>(
    `/dashboard-analytics/summary?${params}`, signal);
  return mapDashboardAnalyticsSummary(data, query);
}
