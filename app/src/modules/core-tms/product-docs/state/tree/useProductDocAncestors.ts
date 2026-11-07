"use client";

import { useMemo } from "react";
import type { ProductDocDetail, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocAncestors(api: ProductDocsApi, scope: ProductDocScope, parentId: string | null | undefined, refresh: number, canEdit: boolean) {
  const { workspaceId, projectId } = scope;
  const request = useMemo(() => {
    if (!parentId) return undefined;
    return async (signal: AbortSignal) => {
      const path: ProductDocDetail[] = [];
      const visited = new Set<string>();
      let id: string | null = parentId;
      while (id && !visited.has(id) && path.length < 40) {
        visited.add(id);
        try {
          const node: ProductDocDetail = await api.get({ workspaceId, projectId }, id, { signal, draft: canEdit });
          path.unshift(node);
          id = node.parentId;
        } catch {
          break;
        }
      }
      return path;
    };
  }, [api, workspaceId, projectId, parentId, refresh, canEdit]);
  const resource = useProductDocResource(request);
  return resource.status === "ready" ? resource.data : undefined;
}
