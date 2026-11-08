import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { ProductDocsApi, ProductDocScope, ProductDocSelection } from "../../../domain/product-docs";
import { productDocLinkMetadata } from "../../description/description-link-metadata";

function unavailable(caught: unknown) {
  return caught instanceof TmsApiError && (caught.status === 404 || caught.status === 403);
}

export async function savePastedRequirements(
  api: Pick<ProductDocsApi, "get" | "linkRequirement" | "listCaseRequirements">,
  scope: ProductDocScope,
  caseId: string,
  selections: readonly ProductDocSelection[],
) {
  if (!selections.length) return;
  const remaining = new Set(selections.map(({docId}) => docId));
  try {
    let cursor: string | undefined;
    do {
      const page = await api.listCaseRequirements(scope, caseId, {cursor, limit: 100});
      if (!page.canEdit) return;
      for (const {docId} of page.requirements) remaining.delete(docId);
      cursor = page.nextCursor ?? undefined;
    } while (cursor && remaining.size);
  } catch (caught) {
    if (unavailable(caught)) return;
    throw caught;
  }
  // A case can link one section per article. Try more specific links before whole articles.
  const candidates = [...selections].sort((a, b) => Number(Boolean(b.sectionId)) - Number(Boolean(a.sectionId)));
  for (const target of candidates) {
    if (!remaining.has(target.docId)) continue;
    try {
      if (target.version !== undefined) {
        const document = await api.get(scope, target.docId, {version: target.version});
        if (!productDocLinkMetadata(document, target)) continue;
      }
      await api.linkRequirement(scope, caseId, target.docId, target.sectionId ?? null, {preserveExisting: true});
      remaining.delete(target.docId);
    } catch (caught) {
      if (!unavailable(caught)) throw caught;
    }
  }
}
