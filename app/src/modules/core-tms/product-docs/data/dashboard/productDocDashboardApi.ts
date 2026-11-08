import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapDashboardAnalyticsSummary } from "../../../dashboards/http/dashboard-summary-mapper";
import type { DashboardPeriod } from "../../../dashboards/model/dashboard-analytics";
import { mapDashboardWorkbench } from "../../../dashboards/workbench/data/workbench-mapper";
import type {
  CaptureDashboardEmbed, DashboardEmbedMode, ProductDocDashboardData,
} from "../../domain/dashboard/dashboardEmbed";
import { setProductDocEmbedRevision, type ProductDocEmbedScope } from "../../domain/embeds/productDocEmbedScope";

type Contract = components["schemas"];

type DashboardEmbedResponse = Contract["ProductDocDashboardEmbed"];

const path = ({ workspaceId, projectId, docId }: ProductDocEmbedScope) =>
  `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/product-docs/${encodeURIComponent(docId)}/dashboard-embeds`;

function mapResponse(value: DashboardEmbedResponse, { workspaceId, projectId }: ProductDocEmbedScope): ProductDocDashboardData {
  const { id, widgetKey, capturedAt, generatedAt, periodDays, summary, workbench, productGroupId, productId, regression } = value;
  const period = `${periodDays}d` as DashboardPeriod;
  if (value.modelVersion !== 1 || ![7, 30, 90].includes(periodDays)
    || !Number.isFinite(Date.parse(capturedAt)) || !Number.isFinite(Date.parse(generatedAt))
    || summary.workspaceId !== workspaceId || summary.projectId !== projectId || summary.period.preset !== period) {
    throw new Error("Invalid dashboard embed response");
  }
  return {
    id, widgetKey, capturedAt, generatedAt, periodDays,
    summary: mapDashboardAnalyticsSummary(summary, { workspaceId, projectId, period, productGroupId, productId, regression }),
    workbench: mapDashboardWorkbench(workbench, { workspaceId, projectId, environmentId: "", buildReference: "", limit: 5 }),
  };
}

export async function readProductDocDashboard(
  http: TmsHttpClient, scope: ProductDocEmbedScope, snapshotId: string, mode: DashboardEmbedMode, signal?: AbortSignal,
): Promise<ProductDocDashboardData> {
  const query = new URLSearchParams({ mode });
  setProductDocEmbedRevision(query, scope);
  const { data } = await http.getResource<DashboardEmbedResponse>(`${path(scope)}/${encodeURIComponent(snapshotId)}?${query}`, signal);
  if (data.id !== snapshotId) throw new Error("Unexpected dashboard snapshot");
  return mapResponse(data, scope);
}

export async function captureProductDocDashboard(
  http: TmsHttpClient, scope: ProductDocEmbedScope, input: CaptureDashboardEmbed, signal?: AbortSignal,
): Promise<string> {
  const { data } = await http.mutateResource<DashboardEmbedResponse>(path(scope), "POST", input, { signal });
  if (data.widgetKey !== input.widgetKey || data.periodDays !== input.periodDays) throw new Error("Unexpected dashboard capture");
  return data.id;
}
