import type { ProductDocScope, ProductDocSection } from "../../domain/product-docs";

export interface DraftContent { title: string; sections: ProductDocSection[] }
export interface BufferedProductDocDraft extends DraftContent {
  baseline: DraftContent & { version: number };
}

export type ProductDocDraftBuffer = Map<string, BufferedProductDocDraft>;

export function productDocDraftKey(scope: ProductDocScope, id: string): string {
  return JSON.stringify([scope.workspaceId, scope.projectId, id]);
}
