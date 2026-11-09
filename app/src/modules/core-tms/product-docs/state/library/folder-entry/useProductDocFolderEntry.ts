"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { resolveProductDocFolderEntry } from "../../../navigation/folder-entry/product-doc-folder-entry";
import type { ProductDocsShelf } from "../useProductDocsLibrary";

export function useProductDocFolderEntry(
  api: ProductDocsApi,
  scope: ProductDocScope,
  shelf: ProductDocsShelf,
  canEdit: boolean,
  onOpen: (node: ProductDocNode, caseId?: string) => void,
) {
  const requestRef = useRef<AbortController>(null);
  const [pending, setPending] = useState<{ id: string; request: AbortController }>();
  useEffect(() => () => requestRef.current?.abort(), [api, scope.projectId, scope.workspaceId, shelf]);
  const openingFolder = pending?.request.signal.aborted ? undefined : pending?.id;

  async function openNode(node: ProductDocNode) {
    if (openingFolder === node.id) return;
    requestRef.current?.abort();
    if (shelf !== "overview" || node.kind !== "folder") {
      setPending(undefined);
      onOpen(node);
      return;
    }
    const request = new AbortController();
    requestRef.current = request;
    setPending({ id: node.id, request });
    const target = await resolveProductDocFolderEntry(api, scope, node, { draft: canEdit, signal: request.signal })
      .catch(() => ({ node, caseId: undefined }));
    if (request.signal.aborted) return;
    requestRef.current = null;
    setPending(undefined);
    onOpen(target.node, target.caseId);
  }
  return { openNode, openingFolder };
}
