"use client";

import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { captureProductDocDashboard, readProductDocDashboard } from "../../data/dashboard/productDocDashboardApi";
import type { CaptureDashboardEmbed, DashboardEmbedMode } from "../../domain/dashboard/dashboardEmbed";
import type { ProductDocEmbedScope } from "../../domain/embeds/productDocEmbedScope";

export function useProductDocDashboardGateway() {
  const http = useOptionalTmsHttpClient();
  return useMemo(() => http && ({
    read: (scope: ProductDocEmbedScope, id: string, mode: DashboardEmbedMode, signal: AbortSignal) =>
      readProductDocDashboard(http, scope, id, mode, signal),
    capture: (scope: ProductDocEmbedScope, input: CaptureDashboardEmbed, signal: AbortSignal) =>
      captureProductDocDashboard(http, scope, input, signal),
  }), [http]);
}
