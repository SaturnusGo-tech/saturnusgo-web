import type { DraftProductDocRequirement, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";

export async function saveDraftRequirements(
  api: Pick<ProductDocsApi, "linkRequirement" | "unlinkRequirement">,
  scope: ProductDocScope,
  caseId: string,
  requirements: readonly DraftProductDocRequirement[],
  applied: Map<string, string | null | undefined>,
) {
  const desired = new Map(requirements.map(({docId, sectionId}) => [docId, sectionId]));
  for (const docId of applied.keys()) {
    if (!desired.has(docId)) {
      await api.unlinkRequirement(scope, caseId, docId);
      applied.delete(docId);
    }
  }
  for (const [docId, sectionId] of desired) {
    if (applied.get(docId) !== sectionId) {
      // An interrupted request may have committed. Remember it even if no receipt arrives.
      applied.set(docId, undefined);
      await api.linkRequirement(scope, caseId, docId, sectionId);
      applied.set(docId, sectionId);
    }
  }
}
