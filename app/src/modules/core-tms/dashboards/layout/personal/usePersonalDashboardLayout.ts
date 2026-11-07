"use client";
import { useEffect, useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useDashboardLayoutController } from "../application/useDashboardLayout";
import type { ProjectBoard } from "../model/layout";
import { watchDashboardView } from "../preferences/sync/watch-dashboard-view";
import { createPersonalDashboardLayoutSource } from "./personal-layout-source";

export function usePersonalDashboardLayout(team: ProjectBoard | null, enabled: boolean) {
  const http = useTmsHttpClient();
  const source = useMemo(() => enabled && team ? createPersonalDashboardLayoutSource(http, team) : null,
    [enabled, http, team]);
  const state = useDashboardLayoutController(source, team);
  useEffect(() => {
    if (!state) return;
    const { controller } = state;
    return watchDashboardView(() => void controller.refresh());
  }, [state?.controller]);
  return state;
}
