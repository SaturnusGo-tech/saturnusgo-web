import type { ImpactAnalysis, ImpactRepository, ImpactScope } from "../model/impact-types";
export function scopedAnalysis(scope: ImpactScope, value: ImpactAnalysis, id?: string, runId?: string): ImpactAnalysis {
  if (!value || value.workspaceId !== scope.workspaceId || value.projectId !== scope.projectId
    || (id && value.id !== id) || (runId && value.runId !== runId)) throw new Error("IMPACT_SCOPE_MISMATCH");
  return value;
}
export function scopedRepositories(scope: ImpactScope, values: ImpactRepository[]): ImpactRepository[] {
  if (!Array.isArray(values) || values.some((value) => !value || value.workspaceId !== scope.workspaceId || value.projectId !== scope.projectId))
    throw new Error("IMPACT_SCOPE_MISMATCH");
  return values;
}
