import type { ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import { uniqueRelatedCases, type ProductDocRelatedCaseSelection } from "../../domain/related-cases/product-doc-related-cases";
import { notifyCaseRequirementsChanged } from "../save/case-requirements-events";

export async function saveRelatedCases(api: Pick<ProductDocsApi, "linkRequirement" | "unlinkRequirement">,
  scope: ProductDocScope, docId: string, selection: ProductDocRelatedCaseSelection) {
  const baseline = new Set(selection.baseline.map(item => item.caseId));
  const desired = new Set(selection.cases.map(item => item.caseId));
  for (const item of uniqueRelatedCases(selection.cases)) {
    if (baseline.has(item.caseId)) continue;
    await api.linkRequirement(scope, item.caseId, docId, null, { preserveExisting: true });
    notifyCaseRequirementsChanged(scope, item.caseId);
  }
  for (const item of uniqueRelatedCases(selection.baseline)) {
    if (desired.has(item.caseId)) continue;
    await api.unlinkRequirement(scope, item.caseId, docId);
    notifyCaseRequirementsChanged(scope, item.caseId);
  }
}
