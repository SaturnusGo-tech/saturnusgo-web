"use client";

import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listFolders } from "../../../folders/data/folder-api";
import { listTestCases } from "../../../test-cases/data/test-case-api";
import type { ProductDocScope } from "../../domain/product-docs";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocCaseCatalog(scope: ProductDocScope) {
  const http = useTmsHttpClient();
  const { workspaceId, projectId } = scope;
  const request = useMemo(() => async (signal: AbortSignal) => {
    const [folders, cases] = await Promise.all([
      listFolders(http, { workspaceId, projectId }, signal), listTestCases(http, projectId, signal),
    ]);
    signal.throwIfAborted();
    if (cases.items.some(item => item.projectId !== projectId)) throw new Error("Related case project scope mismatch.");
    return { folders, cases: cases.items };
  }, [http, workspaceId, projectId]);
  return useProductDocResource(request);
}
