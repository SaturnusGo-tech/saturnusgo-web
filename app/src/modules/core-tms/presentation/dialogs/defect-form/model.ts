import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import type { DefectIntegrationChoice } from "../../../defects/model/integration-target";

export type DefectDraft = {
  title: string;
  description: string;
  preconditions: string;
  testData: string;
  actualResult: string;
  expectedResult: string;
  sourceFolderId?: string | null;
  reproductionSharedSteps?: readonly { sharedStepId: string; revision: number }[];
  component: string;
  severity: Defect["severity"];
  priority: Defect["priority"];
  reproducibility: string;
  assigneeIdentityId: string | null;
  link: string;
};
export type DefectRouting = {
  value: DefectIntegrationChoice;
  onChange: (value: DefectIntegrationChoice) => void;
  options: { value: string; label: string }[];
  disabled: boolean;
  resolved: boolean;
  message: string;
};
export type DefectDraftErrors = Partial<Record<"title" | "actualResult" | "description", string>>;

export type DefectTraceabilityChoices = {
  folders: readonly import("../../../folders/model/folder").RepositoryFolder[];
  sharedSteps: readonly import("../../../shared-steps/model/shared-step").SharedStepSummary[];
  loading?: boolean; error?: string; locked?: boolean;
};
