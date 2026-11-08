"use client";

import { useCallback } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { generateProductDocDiagram } from "../../data/diagrams/generate-product-doc-diagram";
import type { ProductDocScope } from "../../domain/product-docs";

export { productDocDiagramErrorStatus } from "../../data/diagrams/generate-product-doc-diagram";

export function useProductDocDiagram() {
  const http = useOptionalTmsHttpClient();
  const generate = useCallback((scope: ProductDocScope, prompt: string, signal: AbortSignal) => {
    if (!http) return Promise.reject(new Error("Diagram generation is unavailable"));
    return generateProductDocDiagram(http, scope, prompt, signal);
  }, [http]);
  return http ? generate : null;
}
