import type { ImpactAnalysis } from "../impact-types";
import { reviewPage } from "../review/review-page";

export type AnalysisFilter = "all" | "review" | "attention" | "approved" | "active";
export function analysisNeedsAttention(item: ImpactAnalysis): boolean {
  return item.status === "failed" || item.buildStatus === "failed" || item.buildStatus === "cancelled"
    || Boolean(item.errorCode) || item.result?.ai.status === "failed" || item.result?.ai.status === "unavailable";
}
export function analysisMatches(item: ImpactAnalysis, filter: AnalysisFilter): boolean {
  if (filter === "attention") return analysisNeedsAttention(item);
  if (filter === "active") return item.status === "pending" || item.status === "processing";
  if (filter === "approved") return item.approved;
  if (filter === "review") return item.status === "complete" && !item.approved;
  return true;
}
export function analysisSearchText(item: ImpactAnalysis): string {
  return [item.change.repository, item.change.branch, item.change.sha, item.change.author,
    item.change.prNumber == null ? "" : `PR #${item.change.prNumber}`, item.result?.summary, item.errorCode].join(" ");
}
export function analysisCatalog(items: readonly ImpactAnalysis[], query: string, filter: AnalysisFilter, page: number) {
  const filtered = items.filter(item => analysisMatches(item, filter));
  return reviewPage(filtered, query, page, analysisSearchText);
}
export function openCoverageGapCount(item: ImpactAnalysis): number {
  return (item.result?.coverageGaps ?? []).filter(gap => !item.gapActions.some(action =>
    action.gapId === gap.id && (action.status === "generated" || action.status === "acknowledged"))).length;
}
