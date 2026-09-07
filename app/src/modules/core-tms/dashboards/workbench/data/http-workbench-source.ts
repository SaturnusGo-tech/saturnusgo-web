import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { DashboardWorkbenchSource, WorkbenchFailure, WorkbenchQuery, WorkbenchRecordsQuery } from "../model/workbench";
import { WorkbenchReadError } from "../model/workbench-error";
import { mapDashboardWorkbench } from "./workbench-mapper";
import { mapWorkbenchPage } from "./records/workbench-page-mapper";

const errorKind = (error: TmsApiError): WorkbenchFailure["kind"] => {
  if (error.status === 401) return "authentication";
  if (error.status === 403) return "permission";
  if (error.status === 404 && error.code === "NOT_FOUND") return "scope";
  if (error.code === "ANALYTICS_SCOPE_TOO_LARGE") return "scopeTooLarge";
  if (error.status === 503) return "unavailable";
  return "error";
};

export function createHttpDashboardWorkbenchSource(http: TmsHttpClient): DashboardWorkbenchSource {
  async function read<T>(query: WorkbenchQuery, suffix: string, signal?: AbortSignal,
    selection?: { kind: string; cursor?: string }): Promise<T> {
    const params = new URLSearchParams({ limit: String(query.limit) });
    if (query.projectId) params.set("projectId", query.projectId);
    if (query.environmentId) params.set("environmentId", query.environmentId);
    if (query.buildReference) params.set("buildReference", query.buildReference);
    if (selection) params.set("kind", selection.kind);
    if (selection?.cursor) params.set("cursor", selection.cursor);
    try {
      const response = await http.get<T>(
        `/workspaces/${encodeURIComponent(query.workspaceId)}/dashboard-analytics/workbench${suffix}?${params}`, signal);
      signal?.throwIfAborted();
      return response;
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof TmsApiError) throw new WorkbenchReadError({ kind: errorKind(error), requestId: error.requestId });
      throw error;
    }
  }
  return Object.freeze({
    async read(query: WorkbenchQuery, signal?: AbortSignal) {
      const response = await read<components["schemas"]["DashboardWorkbenchEnvelope"]>(query, "", signal);
      return mapDashboardWorkbench(response.data, query);
    },
    async records(query: WorkbenchRecordsQuery, signal?: AbortSignal) {
      const response = await read<components["schemas"]["DashboardWorkbenchRecordPageEnvelope"]>(query, "/records", signal, query);
      return mapWorkbenchPage(response, query);
    },
  });
}
