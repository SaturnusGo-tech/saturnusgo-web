"use client";
import { useMemo } from "react";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useDashboardPreferences } from "../../../../dashboards/layout/preferences/useDashboardPreferences";
import { createHttpDashboardAnalyticsSource } from "../../../../dashboards/source/http-dashboard-analytics-source";
import { useDashboardWorkbench } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useDashboardAnalytics } from "../../controller/useDashboardAnalytics";
import type { DashboardViewProps } from "../../dashboard-view";
export function useDashboardModel({ data, projectId, serverAnalytics = false, analyticsSource }: DashboardViewProps) {
  const http = useTmsHttpClient();
  const preferences = useDashboardPreferences(data.workspace.id, projectId);
  const scope = useMemo(() => ({ workspaceId: data.workspace.id, projectId }), [data.workspace.id, projectId]);
  const { period, environmentId, buildReference, queueTab } = preferences.value;
  const query = useMemo(() => ({ ...scope, period }), [scope, period]);
  const httpSource = useMemo(() => serverAnalytics ? createHttpDashboardAnalyticsSource(http, data) : undefined, [data, http, serverAnalytics]);
  const analytics = useDashboardAnalytics(data, query, analyticsSource ?? httpSource);
  const workbench = useDashboardWorkbench(scope, serverAnalytics, undefined, {
    filters: { environmentId, buildReference }, tab: queueTab,
    setFilters: next => preferences.update(next), selectTab: queueTab => preferences.update({ queueTab }),
  });
  return { preferences, query, analytics, workbench, snapshot: analytics.snapshot };
}
export type DashboardModel = ReturnType<typeof useDashboardModel>;
