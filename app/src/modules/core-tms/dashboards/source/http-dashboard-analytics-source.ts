import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../core/tms/transport/http";
import {
  mapDefectDrill, mapRunDrill, mapRunItemDrill, mapTestCaseDrill,
} from "../http/dashboard-drill-mapper";
import { mapDashboardAnalyticsSummary } from "../http/dashboard-summary-mapper";
import type {
  DashboardAnalyticsQuery, DashboardAnalyticsSource, DashboardDrillRequest,
} from "../model/dashboard-analytics";
import { createBootstrapDashboardAnalyticsSource } from "./bootstrap-dashboard-analytics-source";

type Api = components["schemas"];
const queryKey = (query: DashboardAnalyticsQuery) =>
  `${query.workspaceId}:${query.projectId ?? "workspace"}:${query.period}`;
const unavailableRoute = (error: unknown) => error instanceof TmsApiError &&
  error.status === 404 && error.code === "HTTP_ERROR";

function search(request: DashboardDrillRequest) {
  const params = new URLSearchParams({ workspaceId: request.query.workspaceId });
  const projectId = request.drill.projectId ?? request.query.projectId;
  if (projectId) params.set("projectId", projectId);
  if (request.drill.window) {
    params.set("period", "custom");
    params.set("from", request.drill.window.from);
    params.set("to", request.drill.window.to);
  } else params.set("period", request.query.period);
  const { entity: _entity, ...filter } = request.drill.filter;
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined) params.set(key, String(value));
  }
  if (request.cursor) params.set("cursor", request.cursor);
  params.set("limit", String(Math.min(Math.max(request.limit ?? 25, 1), 100)));
  return params;
}

export function createHttpDashboardAnalyticsSource(http: TmsHttpClient,
  data: Bootstrap): DashboardAnalyticsSource {
  const fallback = createBootstrapDashboardAnalyticsSource(data);
  const fallbackQueries = new Set<string>();
  const projects = new Map(data.projects.map((item) => [item.id, item.name]));

  return Object.freeze({
    async summary(query: DashboardAnalyticsQuery, signal?: AbortSignal) {
      const params = new URLSearchParams({ workspaceId: query.workspaceId,
        period: query.period, dimensionLimit: "20" });
      if (query.projectId) params.set("projectId", query.projectId);
      try {
        const envelope = await http.get<Api["DashboardAnalyticsSummaryEnvelope"]>(
          `/dashboard-analytics/summary?${params}`, signal);
        fallbackQueries.delete(queryKey(query));
        return mapDashboardAnalyticsSummary(envelope.data, query);
      } catch (error) {
        if (!unavailableRoute(error)) throw error;
        fallbackQueries.add(queryKey(query));
        return fallback.summary(query, signal);
      }
    },
    async drill(request: DashboardDrillRequest, signal?: AbortSignal) {
      if (fallbackQueries.has(queryKey(request.query))) return fallback.drill(request, signal);
      const params = search(request);
      switch (request.drill.filter.entity) {
        case "test_case": {
          const envelope = await http.get<Api["DashboardAnalyticsTestCaseListEnvelope"]>(
            `/dashboard-analytics/test-cases?${params}`, signal);
          return mapTestCaseDrill(envelope, projects);
        }
        case "run": {
          const envelope = await http.get<Api["DashboardAnalyticsRunListEnvelope"]>(
            `/dashboard-analytics/runs?${params}`, signal);
          return mapRunDrill(envelope, projects);
        }
        case "run_item": {
          const envelope = await http.get<Api["DashboardAnalyticsRunItemListEnvelope"]>(
            `/dashboard-analytics/run-items?${params}`, signal);
          return mapRunItemDrill(envelope, projects);
        }
        case "defect": {
          const envelope = await http.get<Api["DashboardAnalyticsDefectListEnvelope"]>(
            `/dashboard-analytics/defects?${params}`, signal);
          return mapDefectDrill(envelope, projects);
        }
      }
    },
  });
}
