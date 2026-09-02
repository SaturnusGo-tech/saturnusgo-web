import type {
  Defect,
} from "../../../../core/tms/contracts/legacy-contract";

export type DefectIntegrationTarget = Defect["integrationTarget"];
export type DefectIntegrationChoice = "" | "tms" | Exclude<DefectIntegrationTarget, null>;

export type ResolvedDefectIntegrationChoice = Readonly<{
  resolved: boolean;
  target: DefectIntegrationTarget;
}>;

export function inferDefectIntegrationTarget(
  tags: readonly string[],
  component: string,
): DefectIntegrationTarget {
  const normalized = new Set(tags.map((tag) => tag.trim().toLowerCase()));
  const mobileTargets = (["android", "ios"] as const).filter((target) => normalized.has(target));
  if (mobileTargets.length === 1) return mobileTargets[0] ?? null;
  if (mobileTargets.length > 1) return null;
  if (normalized.has("backend") || /(^|\W)(api|backend|server)(\W|$)/i.test(component)) {
    return "backend";
  }
  return null;
}

export function initialDefectIntegrationChoice(
  tags: readonly string[],
  component: string,
): DefectIntegrationChoice {
  return inferDefectIntegrationTarget(tags, component) ?? "";
}

export function resolveDefectIntegrationChoice(
  choice: DefectIntegrationChoice,
): ResolvedDefectIntegrationChoice {
  if (choice === "") return Object.freeze({ resolved: false, target: null });
  return Object.freeze({ resolved: true, target: choice === "tms" ? null : choice });
}

export function defectClientLabels(hasOccurrence: boolean): string[] {
  // The API derives immutable case-type and run-type provenance from the run snapshot.
  // Sending those reserved labels from the browser is rejected as an attempted override.
  return hasOccurrence ? [] : ["reported"];
}
