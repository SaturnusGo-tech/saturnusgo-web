import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createProductDocsApi } from "../../product-docs-api";

test("logical deletion posts scoped lifecycle version with the caller's stable idempotency key", async () => {
  const calls: unknown[][] = [];
  const receipt = { draftVersion: 10, deletedAt: "2026-11-13T00:00:00Z", affectedCount: 4 };
  const http = { mutateResource: async (...args: unknown[]) => { calls.push(args); return { data: receipt, etag: "10" }; } } as unknown as TmsHttpClient;
  const result = await createProductDocsApi(http).delete({ workspaceId: "w/1", projectId: "p/2" }, "doc/3",
    { expectedDraftVersion: 9 }, { idempotencyKey: "same-attempt" });
  assert.deepEqual(calls, [["/workspaces/w%2F1/projects/p%2F2/product-docs/doc%2F3/delete", "POST",
    { expectedDraftVersion: 9 }, { idempotencyKey: "same-attempt" }]]);
  assert.equal(result, receipt);
});
