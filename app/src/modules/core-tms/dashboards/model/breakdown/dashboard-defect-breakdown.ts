import type { DashboardAnalyticsQuery } from "../dashboard-analytics";

export type DashboardDefectGroup = "project" | "component" | "assignee" | "status" | "priority" | "severity";
export type DashboardDefectSegment = "none" | "status" | "priority" | "severity";
export type DashboardDefectBasis = "current" | "reported";
export type DashboardDefectBreakdownRequest = {
  query: DashboardAnalyticsQuery;
  basis: DashboardDefectBasis;
  groupBy: DashboardDefectGroup;
  segmentBy: DashboardDefectSegment;
  hasLink?: boolean;
};

export type DashboardDefectBreakdown = {
  total: number;
  groupCount: number;
  truncated: boolean;
  period: { from: string; to: string };
  periodApplied: boolean;
  groups: Array<{
    key: string | null;
    label: string | null;
    count: number;
    segments: Array<{ key: string; count: number }>;
  }>;
};
