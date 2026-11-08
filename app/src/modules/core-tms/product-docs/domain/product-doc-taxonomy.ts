import type { components } from "../../../../core/tms/generated/tms-api";

export type ProductDocTaxonomy = components["schemas"]["ProductDocTaxonomy"];
export type ProductDocTaxonomyInput = components["schemas"]["ProductDocTaxonomyInput"];
export type ProductDocSearchMatch = components["schemas"]["ProductDocSearchMatch"];
export type ProductDocFilters = { productGroupId?: string; productId?: string };

export const emptyProductDocTaxonomy: ProductDocTaxonomy = { productGroup: null, product: null };

export function productDocTaxonomyInput(taxonomy?: ProductDocTaxonomy): ProductDocTaxonomyInput {
  return {
    productGroupId: taxonomy?.productGroup?.id ?? null,
    productId: taxonomy?.product?.id ?? null,
  };
}
