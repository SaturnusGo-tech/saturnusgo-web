"use client";
import { useEffect, useMemo } from "react";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useDashboardLayoutController } from "../../application/useDashboardLayout";
import type { BoardScope } from "../../model/layout";
import { watchDashboardView } from "../../preferences/sync/watch-dashboard-view";
import { createPersonalDashboardBoardSource } from "./personal-board-source";

export function usePersonalDashboardBoard(scope: BoardScope, enabled: boolean) {
  const http = useTmsHttpClient();
  const source = useMemo(() => enabled ? createPersonalDashboardBoardSource(http) : null, [enabled, http]);
  const state = useDashboardLayoutController(source, scope);
  const controller = state?.controller;
  useEffect(() => {
    if (controller) return watchDashboardView(() => void controller.refresh());
  }, [controller]);
  return state;
}
