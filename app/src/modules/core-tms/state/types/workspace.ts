import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";

export type View =
  | "dashboard"
  | "cases"
  | "integrations"
  | "api"
  | "suites"
  | "config"
  | "runs"
  | "hooks"
  | "reports";

export type Dialog =
  | "project"
  | "folder"
  | "case"
  | "integration"
  | "suite"
  | "environment"
  | "run"
  | "defect"
  | "dashboard"
  | null;

export type CaseFilters = {
  priority: "all" | TestCaseRevision["priority"];
  lifecycle: "all" | TestCaseRevision["lifecycle"];
  tag: string;
  includeArchived: boolean;
};
