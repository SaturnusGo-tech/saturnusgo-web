import type { RunItem } from "../../../../../core/tms/contracts/legacy-contract";

export type DefectExecutionStep = {
  readonly kind: "step" | "checklist";
  readonly order: number;
  readonly text: string;
};

export function resolveDefectExecutionStep(item: RunItem | undefined,
  stepId: string | null | undefined): DefectExecutionStep | null {
  if (!item || !stepId) return null;
  const matches: DefectExecutionStep[] = [];
  for (const step of item.snapshot.steps) {
    if (step.id === stepId) matches.push({ kind: "step", order: step.order, text: step.action });
    for (const child of step.sharedStep?.items ?? []) {
      if (child.id === stepId) matches.push({ kind: "step", order: child.order, text: child.action });
    }
  }
  for (const entry of item.snapshot.checklist) {
    if (entry.id === stepId) matches.push({ kind: "checklist", order: entry.order, text: entry.text });
  }
  return matches.length === 1 ? matches[0] : null;
}
