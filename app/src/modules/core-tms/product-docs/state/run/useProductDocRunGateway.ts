"use client";

import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { captureProductDocRun, listProductDocRuns, readProductDocRun } from "../../data/run/productDocRunApi";
import type { CaptureProductDocRunInput, RunEvidenceQuery } from "../../domain/run/productDocRunCandidates";
import type { ProductDocEmbedScope } from "../../domain/embeds/productDocEmbedScope";

export function useProductDocRunGateway() {
  const http = useOptionalTmsHttpClient();
  return useMemo(() => http && ({
    read: (scope: ProductDocEmbedScope, id: string, signal: AbortSignal) => readProductDocRun(http, scope, id, signal),
    list: (scope: ProductDocEmbedScope, query: RunEvidenceQuery, cursor: string | null, signal: AbortSignal) => listProductDocRuns(http, scope, query, cursor, signal),
    capture: (scope: ProductDocEmbedScope, input: CaptureProductDocRunInput, signal: AbortSignal) => captureProductDocRun(http, scope, input, signal),
  }), [http]);
}
