import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { BulkCaseMutation } from "../../../test-cases/data/bulk/test-case-bulk-api";

const REFRESHABLE_BULK_FAILURES = new Set([
  "PRECONDITION_FAILED",
  "NOT_FOUND",
  "CONFLICT",
]);

export function shouldRefreshAfterBulkFailure(code: string | null) {
  return code !== null && REFRESHABLE_BULK_FAILURES.has(code);
}

export function bulkFailureInvalidatesSelection(code: string | null) {
  return code === "NOT_FOUND" || code === "CONFLICT";
}

export function reconcileCaseSummaries(
  summaries: readonly TestCaseSummary[],
  updates: BulkCaseMutation["items"],
) {
  const byId = new Map(updates.map((item) => [item.id, item]));
  return summaries.map((summary) => {
    const update = byId.get(summary.id);
    if (!update) return summary;
    return {
      ...summary,
      currentRevision: update.currentRevision,
      revisionCount: summary.revisionCount + Math.max(
        0,
        update.currentRevision - summary.currentRevision,
      ),
      lifecycle: update.lifecycle,
      priority: update.priority,
      updatedAt: update.updatedAt,
      etag: update.etag,
    };
  });
}
