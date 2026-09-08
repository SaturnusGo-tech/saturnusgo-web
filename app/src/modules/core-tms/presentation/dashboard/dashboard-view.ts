import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardDrillRow } from "../../dashboards/model/dashboard-analytics";
import type { DashboardDrillTab } from "./inspector/dashboard-drill-navigation";
export type DashboardViewProps = {
  data: Bootstrap;
  projectId: string;
  onOpenEntity: (tab: DashboardDrillTab, drill: DashboardDrill) => void;
  onOpenRow: (row: DashboardDrillRow) => void;
  onCreateRun: (caseIds: string[]) => void;
  serverAnalytics?: boolean;
  analyticsSource?: DashboardAnalyticsSource;
};
