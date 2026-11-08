"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { ProductDocEmbedScope } from "../../../domain/embeds/productDocEmbedScope";
import type { ProductDocScope } from "../../../domain/product-docs";

export const ProductDocEmbedContext = createContext<ProductDocEmbedScope | null>(null);

export function ProductDocDraftEmbedScope({ scope, docId, children }: {
  scope: ProductDocScope; docId: string; children: ReactNode;
}) {
  const { workspaceId, projectId } = scope;
  const value = useMemo(() => ({ workspaceId, projectId, docId, draft: true }), [workspaceId, projectId, docId]);
  return <ProductDocEmbedContext.Provider value={value}>{children}</ProductDocEmbedContext.Provider>;
}
