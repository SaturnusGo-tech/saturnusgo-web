import assert from "node:assert/strict";
import test from "node:test";
import type { ProductDocsApi } from "../../../domain/product-docs";
import { saveRelatedCases } from "../save-related-cases";

const scope = { workspaceId: "workspace", projectId: "project" };
const link = (caseId: string) => ({ caseId, title: caseId, sectionId: null });

test("explicit save adds unique links without replacing existing section links or revising cases", async () => {
  const persisted = new Map<string, string | null>([["a", "section"]]);
  const api = {
    async linkRequirement(requestScope, caseId, docId, sectionId, options) {
      assert.deepEqual(requestScope, scope); assert.equal(docId, "doc");
      if (!options?.preserveExisting || !persisted.has(caseId)) persisted.set(caseId, sectionId);
      return { docId };
    },
    async unlinkRequirement(_scope, caseId, docId) { persisted.delete(caseId); return { docId }; },
  } satisfies Pick<ProductDocsApi, "linkRequirement" | "unlinkRequirement">;
  await saveRelatedCases(api, scope, "doc", { baseline: [link("a")], cases: [link("a"), link("b"), link("b")] });
  assert.deepEqual([...persisted], [["a", "section"], ["b", null]]);
});

test("removal affects only baseline links and an interrupted save can be retried safely", async () => {
  const persisted = new Set(["a", "external"]); let attempts = 0;
  const api = {
    async linkRequirement(_scope, caseId, docId) {
      persisted.add(caseId); if (++attempts === 1) throw new Error("Receipt lost"); return { docId };
    },
    async unlinkRequirement(_scope, caseId, docId) { persisted.delete(caseId); return { docId }; },
  } satisfies Pick<ProductDocsApi, "linkRequirement" | "unlinkRequirement">;
  const selection = { baseline: [link("a")], cases: [link("b")] };
  await assert.rejects(saveRelatedCases(api, scope, "doc", selection), /Receipt lost/);
  await saveRelatedCases(api, scope, "doc", selection);
  assert.deepEqual([...persisted].sort(), ["b", "external"]);
});
