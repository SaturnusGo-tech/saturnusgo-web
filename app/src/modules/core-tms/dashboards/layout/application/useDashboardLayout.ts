"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { createLayoutSource } from "../data/layout-source";
import type { BoardScope } from "../model/layout";
import { DashboardLayoutController } from "./DashboardLayoutController";

export function useDashboardLayout(scope: BoardScope) {
  const http = useTmsHttpClient();
  const controller = useMemo(() => new DashboardLayoutController(createLayoutSource(http), scope,
    () => crypto.randomUUID()), [http, scope.workspaceId, scope.projectId]);
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  useEffect(() => { void controller.load(); return () => controller.dispose(); }, [controller]);
  useEffect(() => {
    if (!state.draft) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [Boolean(state.draft)]);
  return { ...state, controller };
}
export type DashboardLayoutModel = ReturnType<typeof useDashboardLayout>;
