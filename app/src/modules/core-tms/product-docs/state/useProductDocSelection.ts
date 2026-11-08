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
  const target = useMemo(() => ({
    api, scope: { workspaceId, projectId }, docId, version, draft, allowDraft,
  }), [api, workspaceId, projectId, docId, version, draft, allowDraft]);
  const request = useMemo(() => {
    const { api, scope, docId, version, draft, allowDraft } = target;
    if (!docId) return undefined;
    return async (signal: AbortSignal) => {
      try {
        return await api.get(scope, docId, { version: draft ? undefined : version, draft, signal });
      } catch (error) {
        if (!allowDraft || draft || version !== undefined || !isMissingProductDoc(error)) throw error;
        signal.throwIfAborted();
        return await api.get(scope, docId, { draft: true, signal });
      }
    };
  }, [target, refresh]);
  return useProductDocResource(request, target);
}
