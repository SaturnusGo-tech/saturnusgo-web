"use client";

import { useMemo } from "react";
import { isMissingProductDoc } from "../domain/errors/product-doc-response";
import type { ProductDocsApi, ProductDocScope, ProductDocSelection } from "../domain/product-docs";
import { useProductDocResource } from "./useProductDocResource";

export function useProductDocSelection(
  api: ProductDocsApi,
  scope: ProductDocScope,
  selection: ProductDocSelection | undefined,
  draft = false,
  refresh = 0,
  allowDraft = false,
) {
  const { workspaceId, projectId } = scope;
  const docId = selection?.docId;
  const version = selection?.version;
  const request = useMemo(() => {
    if (!docId) return undefined;
    const target = { workspaceId, projectId };
    return async (signal: AbortSignal) => {
      try {
        return await api.get(target, docId, { version: draft ? undefined : version, draft, signal });
      } catch (error) {
        if (!allowDraft || draft || version !== undefined || !isMissingProductDoc(error)) throw error;
        signal.throwIfAborted();
        return await api.get(target, docId, { draft: true, signal });
      }
    };
  }, [api, workspaceId, projectId, docId, version, draft, refresh, allowDraft]);
  return useProductDocResource(request);
}
