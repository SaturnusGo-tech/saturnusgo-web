import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

type Api = components["schemas"];
export type BulkCasePatch = Api["TestCaseBulkMutationPatch"];
export type BulkCaseMutation = Api["TestCaseBulkMutationData"];
export type BulkCaseMutationInput = Api["TestCaseBulkMutationRequest"];

function verifyResponse(
  input: BulkCaseMutationInput,
  result: BulkCaseMutation,
) {
  const ordered = result.items.length === input.items.length
    && result.items.every((item, index) => item.id === input.items[index]?.caseId);
  const changed = result.items.filter((item) => item.changed).length;
  const etagsValid = result.items.every((item) => typeof item.etag === "string" && item.etag.length > 0);
  if (
    !ordered
    || !etagsValid
    || result.updatedCount !== changed
    || result.unchangedCount !== result.items.length - changed
  ) throw new Error("Bulk test-case response does not match the requested scope.");
  return result;
}

export async function bulkUpdateTestCases(
  http: TmsHttpClient,
  input: BulkCaseMutationInput,
  idempotencyKey: string,
  signal?: AbortSignal,
) {
  const resource = await http.mutateResource<BulkCaseMutation>(
    "/test-cases/bulk",
    "PATCH",
    input satisfies Api["TestCaseBulkMutationRequest"],
    { idempotencyKey, signal },
  );
  return verifyResponse(input, resource.data);
}
