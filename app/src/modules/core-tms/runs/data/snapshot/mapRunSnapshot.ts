import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import { mapTestCaseRevision } from "../../../test-cases/data/test-case-mapper";

export function mapRunSnapshot(dto: components["schemas"]["RunCaseSnapshot"]): TestCaseRevision {
  const snapshot = mapTestCaseRevision({ ...dto, steps: dto.steps.map(step => ({
    ...step, sharedStepId: step.sharedStepId ?? null, sharedStep: null,
  })) });
  return { ...snapshot, steps: snapshot.steps.map((step, index) => ({ ...step,
    sharedStepTitle: dto.steps[index]?.sharedStepTitle ?? null,
    sharedStepRevision: dto.steps[index]?.sharedStepRevision ?? null,
    sharedStepReferenceId: dto.steps[index]?.sharedStepReferenceId ?? null,
    sharedStepItemId: dto.steps[index]?.sharedStepItemId ?? null,
  })) };
}
