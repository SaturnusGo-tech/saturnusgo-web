import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";

export const workspaceViews = [
  "portfolios", "dashboard", "cases", "shared-steps", "api", "suites", "config", "runs", "hooks", "reports", "help", "profile",
] as const;
export type View = typeof workspaceViews[number];

export type Dialog =
  | "project"
  | "folder"
  | "import-cases"
  | "case"
  | "suite"
  | "environment"
  | "run"
  | "defect"
  | null;

export type CaseFilters = {
  type: "all" | TestCaseRevision["type"];
  priority: "all" | TestCaseRevision["priority"];
  lifecycle: "all" | TestCaseRevision["lifecycle"];
  tag: string;
  includeArchived: boolean;
};
