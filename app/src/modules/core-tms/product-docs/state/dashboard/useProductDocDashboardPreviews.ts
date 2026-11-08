"use client";

import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { readDashboardSummary } from "../../../dashboards/source/summary/readDashboardSummary";
import { createHttpDashboardWorkbenchSource } from "../../../dashboards/workbench/data/http-workbench-source";
import type { DashboardEmbedPeriod } from "../../domain/dashboard/dashboardEmbed";
import type { ProductDocScope } from "../../domain/product-docs";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocDashboardPreviews(scope: ProductDocScope | null, days: DashboardEmbedPeriod) {
  const http = useOptionalTmsHttpClient();
  const workspaceId = scope?.workspaceId;
  const projectId = scope?.projectId;
  const period = `${days}d` as const;
  const target = useMemo(() => http && workspaceId && projectId ? { http, workspaceId, projectId } : undefined,
    [http, workspaceId, projectId]);
  const summary = useProductDocResource(useMemo(() => {
    if (!http || !workspaceId || !projectId) return;
    return (signal: AbortSignal) => readDashboardSummary(http, { workspaceId, projectId, period }, signal);
  }, [http, workspaceId, projectId, period]), target);
  const workbench = useProductDocResource(useMemo(() => {
    if (!http || !workspaceId || !projectId) return;
    const source = createHttpDashboardWorkbenchSource(http);
    return (signal: AbortSignal) => source.read({ workspaceId, projectId, environmentId: "", buildReference: "", limit: 5 }, signal);
  }, [http, workspaceId, projectId]));
  return { summary: summary.status === "ready" ? summary.data : null,
    refreshing: summary.status === "ready" && summary.data.query.period !== period,
    workbench: workbench.status === "ready" ? workbench.data : null };
}
