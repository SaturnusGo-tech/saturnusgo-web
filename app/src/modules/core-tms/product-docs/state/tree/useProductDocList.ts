"use client";

import { useEffect, useState } from "react";
import type { ProductDocList, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";

type Loaded = { key: string; data: ProductDocList; error: boolean; loading: boolean };

export function useProductDocList(api: ProductDocsApi, scope: ProductDocScope, options: {
  parentId?: string | null;
  q?: string;
  refresh: number;
  draft?: boolean;
}) {
  const { workspaceId, projectId } = scope;
  const { parentId, q, refresh, draft } = options;
  const key = JSON.stringify([workspaceId, projectId, parentId, q, draft]);
  const pageKey = JSON.stringify([key, refresh]);
  const [loaded, setLoaded] = useState<Loaded>();
  const [page, setPage] = useState<{ key: string; cursor?: string; attempt: number }>();
  const active = loaded?.key === key ? loaded : undefined;
  const cursor = page?.key === pageKey ? page.cursor : undefined;
  const attempt = page?.key === pageKey ? page.attempt : undefined;
  useEffect(() => {
    const abort = new AbortController();
    setLoaded((previous) => previous?.key === key ? { ...previous, error: false, loading: true } : undefined);
    api.list({ workspaceId, projectId }, { parentId, q, draft, cursor, limit: 40, signal: abort.signal }).then((data) => {
      if (abort.signal.aborted) return;
      setLoaded((previous) => {
        const previousNodes = cursor && previous?.key === key ? previous.data.nodes : [];
        const nodes = new Map(previousNodes.map((node) => [node.id, node]));
        data.nodes.forEach((node) => nodes.set(node.id, node));
        return { key, data: { ...data, nodes: [...nodes.values()] }, error: false, loading: false };
      });
    }, () => {
      if (abort.signal.aborted) return;
      setLoaded((previous) => ({
        key, error: true, loading: false,
        data: previous?.key === key ? previous.data : { nodes: [], nextCursor: null, canEdit: false, canPublish: false },
      }));
    });
    return () => abort.abort();
  }, [api, workspaceId, projectId, parentId, q, draft, key, refresh, cursor, attempt]);

  return {
    data: active?.data,
    loading: !active || active.loading,
    error: active?.error ?? false,
    retry() { setPage({ key: pageKey, cursor, attempt: (attempt ?? 0) + 1 }); },
    more() {
      if (!active?.data.nextCursor || active.loading) return;
      setPage({ key: pageKey, cursor: active.data.nextCursor, attempt: 0 });
    },
  };
}
