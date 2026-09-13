import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import type { DefectIntegrationChoice } from "../../../defects/model/integration-target";

export type DefectDraft = {
  title: string;
  description: string;
  actualResult: string;
  expectedResult: string;
  reproduction?: string;
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
export type DefectDraftErrors = Partial<Record<"title" | "actualResult" | "description" | "reproduction", string>>;
