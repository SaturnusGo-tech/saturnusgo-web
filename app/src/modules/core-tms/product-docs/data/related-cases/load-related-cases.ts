import type { ProductDocCase, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import { uniqueRelatedCases } from "../../domain/related-cases/product-doc-related-cases";

export async function loadRelatedCases(api: Pick<ProductDocsApi, "getImpact">, scope: ProductDocScope,
  docId: string, signal: AbortSignal, draftVersion?: number): Promise<ProductDocCase[]> {
  const cases: ProductDocCase[] = [], seen = new Set<string>();
  let cursor: string | undefined;
  do {
    signal.throwIfAborted();
    const page = await api.getImpact(scope, docId, { signal, limit: 100, cursor,
      ...(draftVersion === undefined ? {} : { draft: true, expectedDraftVersion: draftVersion }) });
    signal.throwIfAborted();
    cases.push(...page.cases.map(({ caseId, title, sectionId }) => ({ caseId, title, sectionId })));
    cursor = page.nextCursor ?? undefined;
    if (cursor && seen.has(cursor)) throw new Error("Related case pagination did not advance.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return uniqueRelatedCases(cases);
}
