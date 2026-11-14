import { useCaseData } from "../../application/editor/CaseDataContext";
import { DataValidation } from "../validation/DataValidation";
export function StepDataFindings({ stepId, ru }: { stepId: string; ru: boolean }) {
  const data = useCaseData();
  return <DataValidation findings={data?.validation?.errors ?? []} stepId={stepId} ru={ru} />;
}
