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
  blocked?: boolean;
}

export type ProductDocDraftBuffer = Map<string, BufferedProductDocDraft> & {
  subscribe?(listener: () => void): () => void;
  revision?(): number;
  epoch?(key: string): number;
  acknowledged?(key: string): BufferedProductDocDraft["baseline"] | undefined;
  acknowledge?(key: string, snapshot: BufferedProductDocDraft, baseline: BufferedProductDocDraft["baseline"], epoch: number): void;
  flush?(): Promise<boolean>;
  saving?(): boolean;
};

export function productDocDraftKey(scope: ProductDocScope, id: string): string {
  return JSON.stringify([scope.workspaceId, scope.projectId, id]);
}
