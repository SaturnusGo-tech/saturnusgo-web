import type { DashboardProductFilters, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import type { WorkbenchSnapshot } from "../../../dashboards/workbench/model/workbench";

export type DashboardEmbedMode = "snapshot" | "current";
export type DashboardEmbedPeriod = 7 | 30 | 90;
export type CaptureDashboardEmbed = DashboardProductFilters & {
  widgetKey: string;
  periodDays: DashboardEmbedPeriod;
  commandId: string;
};
export type ProductDocDashboardData = {
  id: string;
  widgetKey: string;
  periodDays: DashboardEmbedPeriod;
  capturedAt: string;
  generatedAt: string;
  summary: DashboardSnapshot;
  workbench: WorkbenchSnapshot;
};
