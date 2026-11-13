import type { SharedStepSnapshot, TestStep } from "../../../../../../../core/tms/contracts/legacy-contract";
import { insertStepAfter, sharedScenarioStep } from "../stepOperations";

export function insertSharedStepAfter(steps: readonly TestStep[], index: number, snapshot: SharedStepSnapshot) {
  const first = steps[0];
  const untouched = index === -1 && steps.length === 1 && first && !first.sharedStepId
    && !first.action.trim() && !first.expectedResult.trim() && !first.testData?.trim()
    && !first.attachmentIds?.length;
  return insertStepAfter(untouched ? [] : steps, index, sharedScenarioStep(index + 2, snapshot));
}
