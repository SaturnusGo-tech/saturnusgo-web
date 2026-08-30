import type { Defect } from "../../../../core/tms/contracts/legacy-contract";

export type DefectIntegrationTarget = Defect["integrationTarget"];

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
