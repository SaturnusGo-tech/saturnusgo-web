"use client";

import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listTestCases } from "../../../test-cases/data/test-case-api";
import { resolveProductDocRepository } from "../../data/repository/product-doc-repository-reference";
import type { ProductDocScope } from "../../domain/product-docs";
import type { ProductDocRepositoryTarget } from "../../navigation/product-doc-smart-link";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocRepository(scope: ProductDocScope, target?: ProductDocRepositoryTarget) {
  const client = useTmsHttpClient();
  const projectId = target?.projectId, folderId = target?.folderId, folderPath = target?.folderPath;
  const { workspaceId } = scope;
  const request = useMemo(() => projectId ? async (signal: AbortSignal) => {
    const reference = await resolveProductDocRepository(client, { workspaceId, projectId },
      { kind: "repository", projectId, folderId, folderPath });
    // The metadata resolver is shared with previews. A dismissed drawer must not
    // continue into case pagination or publish a stale project's tree.
    signal.throwIfAborted();
    if (!reference) return null;
    const response = await listTestCases(client, projectId, signal);
    signal.throwIfAborted();
    if (response.items.some(item => item.projectId !== projectId)) throw new Error("Repository case scope mismatch.");
    return { ...reference, cases: response.items, projectId };
  } : undefined, [client, workspaceId, projectId, folderId, folderPath]);
  return useProductDocResource(request);
}
