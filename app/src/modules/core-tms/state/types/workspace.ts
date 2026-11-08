import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";

export const workspaceViews = [
  "portfolios", "dashboard", "cases", "product-docs", "custom-fields", "imports", "shared-steps", "api", "suites", "config", "runs", "hooks", "reports", "help", "profile", "notifications",
] as const;
export type View = typeof workspaceViews[number];

export type Dialog =
  | "project"
  | "folder"
  | "case"
  | "suite"
  | "environment"
  | "run"
  | "defect"
  | "case-defect"
  | null;

export type CaseFilters = {
  type: "all" | TestCaseRevision["type"];
  priority: "all" | "none" | TestCaseRevision["priority"];
  lifecycle: "all" | TestCaseRevision["lifecycle"];
  maintenanceStatus?: "all" | "current" | "needs_update";
  tag: string;
  includeArchived: boolean;
};
