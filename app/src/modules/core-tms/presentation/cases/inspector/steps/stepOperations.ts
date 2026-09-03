import type {
  SharedStepSnapshot, TestStep,
} from "../../../../../../core/tms/contracts/legacy-contract";

export function emptyScenarioStep(order: number): TestStep {
  return { id: `step-${crypto.randomUUID()}`, order, action: "", expectedResult: "",
    testData: "", required: true, attachmentIds: [], sharedStepId: null, sharedStep: null };
}

export function sharedScenarioStep(order: number, snapshot: SharedStepSnapshot): TestStep {
  return { id: `step-${crypto.randomUUID()}`, order, action: "", expectedResult: "",
    testData: "", required: true, attachmentIds: [], sharedStepId: snapshot.id, sharedStep: snapshot };
}

export function insertStepAfter(steps: readonly TestStep[], index: number, step: TestStep) {
  const next = [...steps];
  next.splice(index + 1, 0, step);
  return next.map((item, order) => ({ ...item, order: order + 1 }));
}

export function duplicateStepAfter(steps: readonly TestStep[], index: number) {
  const source = steps[index];
  if (!source) return [...steps];
  const copy: TestStep = { ...source, id: `step-${crypto.randomUUID()}`,
    attachmentIds: source.attachmentIds ? [...source.attachmentIds] : [],
    sharedStep: source.sharedStep ? { ...source.sharedStep,
      items: source.sharedStep.items.map((item) => ({ ...item,
        attachmentIds: item.attachmentIds ? [...item.attachmentIds] : [] })) } : null };
  return insertStepAfter(steps, index, copy);
}
