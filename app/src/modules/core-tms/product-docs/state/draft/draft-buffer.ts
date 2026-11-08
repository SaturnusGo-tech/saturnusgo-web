import type { ProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import type { ProductDocProperties } from "../../domain/properties/product-doc-properties";
import type { ProductDocScope, ProductDocSection, ProductDocTitleHighlight } from "../../domain/product-docs";

export interface DraftContent {
  title: string;
  sections: ProductDocSection[];
  titleHighlights?: ProductDocTitleHighlight[];
  taxonomy?: ProductDocTaxonomy;
  properties?: ProductDocProperties;
}
export interface BufferedProductDocDraft extends DraftContent {
  baseline: DraftContent & { version: number };
}

export type ProductDocDraftBuffer = Map<string, BufferedProductDocDraft>;

export function productDocDraftKey(scope: ProductDocScope, id: string): string {
  return JSON.stringify([scope.workspaceId, scope.projectId, id]);
}
