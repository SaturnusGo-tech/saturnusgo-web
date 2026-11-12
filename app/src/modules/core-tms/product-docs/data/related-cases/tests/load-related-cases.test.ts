import assert from "node:assert/strict";
import test from "node:test";
import type { ProductDocsApi } from "../../../domain/product-docs";
import { loadRelatedCases } from "../load-related-cases";

const scope = { workspaceId: "workspace", projectId: "project" };
test("all linked-case pages are loaded and repeated case rows do not inflate the count", async () => {
  const a = { caseId: "a", title: "A", sectionId: null }, b = { caseId: "b", title: "B", sectionId: null };
  const api = { async getImpact(_scope, _docId, options) {
    assert.equal(options?.draft, true); assert.equal(options?.expectedDraftVersion, 3);
    return options?.cursor ? { cases: [a, b], nextCursor: null } : { cases: [a], nextCursor: "next" };
  } } as Pick<ProductDocsApi, "getImpact">;
  assert.deepEqual(await loadRelatedCases(api, scope, "doc", new AbortController().signal, 3), [a, b]);
});

test("a repeated cursor is rejected instead of showing an incomplete linked-case count", async () => {
  const api = { async getImpact() { return { cases: [], nextCursor: "same" }; } } as unknown as Pick<ProductDocsApi, "getImpact">;
  await assert.rejects(loadRelatedCases(api, scope, "doc", new AbortController().signal), /pagination/i);
});
