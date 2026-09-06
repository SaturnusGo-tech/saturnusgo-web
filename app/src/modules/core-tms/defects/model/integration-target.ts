import type {
  Defect,
} from "../../../../core/tms/contracts/legacy-contract";

export type DefectIntegrationTarget = Defect["integrationTarget"];
export type DefectIntegrationChoice = string;

export type ResolvedDefectIntegrationChoice = Readonly<{
  resolved: boolean;
  target: DefectIntegrationTarget;
}>;

export function inferDefectIntegrationTarget(
  _tags: readonly string[],
  _component: string,
): DefectIntegrationTarget {
  // Routing belongs to the workspace configuration. The server evaluates
  // component/tag rules and then falls back to the default route.
  return null;
}

export function inferLegacyDefectIntegrationTarget(
  tags: readonly string[],
  component: string,
): DefectIntegrationTarget {
  const normalized = new Set(tags.map((tag) => tag.trim().toLowerCase()));
  const mobile = (["android", "ios"] as const).filter((target) => normalized.has(target));
  if (mobile.length === 1) return mobile[0] ?? null;
  if (mobile.length > 1) return null;
  if (normalized.has("backend") || /(^|\W)(api|backend|server)(\W|$)/i.test(component)) return "backend";
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
  automaticRouting = true,
): ResolvedDefectIntegrationChoice {
  if (!choice.trim()) return Object.freeze({ resolved: automaticRouting, target: null });
  return Object.freeze({ resolved: true, target: choice === "tms" ? null : choice.trim() });
}

export function defectClientLabels(hasOccurrence: boolean): string[] {
  // The API derives immutable case-type and run-type provenance from the run snapshot.
  // Sending those reserved labels from the browser is rejected as an attempted override.
  return hasOccurrence ? [] : ["reported"];
}
