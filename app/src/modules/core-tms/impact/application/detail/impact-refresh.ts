import type { ImpactAnalysis } from "../../model/impact-types";
export function shouldRefreshImpact(analysis: ImpactAnalysis): boolean {
  return analysis.status === "pending" || analysis.status === "processing" || analysis.buildStatus === "pending"
    || analysis.gapActions.some((gap) => gap.status === "generating");
}
