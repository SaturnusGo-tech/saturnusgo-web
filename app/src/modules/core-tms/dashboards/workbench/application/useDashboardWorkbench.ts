"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { createHttpDashboardWorkbenchSource } from "../data/http-workbench-source";
import type { DashboardWorkbenchSource, WorkbenchFilters, WorkbenchScope } from "../model/workbench";
import { workbenchKey } from "../model/workbench";
import { DashboardWorkbenchController } from "./DashboardWorkbenchController";

export function useDashboardWorkbench(scope: WorkbenchScope, enabled = true,
  suppliedSource?: DashboardWorkbenchSource, preference?: {
    filters: WorkbenchFilters; tab: "activeRuns" | "readyForRetest";
    setFilters: (filters: WorkbenchFilters) => void; selectTab: (tab: "activeRuns" | "readyForRetest") => void;
  }) {
  const http = useTmsHttpClient();
  const source = useMemo(() => suppliedSource ?? createHttpDashboardWorkbenchSource(http), [http, suppliedSource]);
  const controller = useMemo(() => new DashboardWorkbenchController(source), [source]);
  const scopeKey = JSON.stringify([scope.workspaceId, scope.projectId ?? null]);
  const [selection, setSelection] = useState({ scopeKey, environmentId: "", buildReference: "" });
  const [tab, selectTab] = useState<"activeRuns" | "readyForRetest">("activeRuns");
  const filters: WorkbenchFilters = preference?.filters ?? (selection.scopeKey === scopeKey
    ? { environmentId: selection.environmentId, buildReference: selection.buildReference }
    : { environmentId: "", buildReference: "" });
  const key = workbenchKey({ ...scope, ...filters });
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);

  useEffect(() => {
    if (enabled) controller.configure(scope, filters);
    else controller.reset();
    return () => controller.reset();
  }, [controller, enabled, key]);

  const visible = enabled && state.key === key;
  return {
    snapshot: visible ? state.snapshot : null,
    loading: enabled && (!visible || state.loading),
    error: visible ? state.error : null,
    drill: visible ? state.drill : null,
    enabled, scopeKey, filters, tab: preference?.tab ?? tab, selectTab: preference?.selectTab ?? selectTab,
    setFilters: preference?.setFilters ?? ((next: WorkbenchFilters) => setSelection({ scopeKey, ...next })),
    refresh: controller.refresh,
    openDrill: controller.openDrill,
    closeDrill: controller.closeDrill,
    retryDrill: controller.retryDrill,
    refreshDrill: controller.refreshDrill,
    loadMore: controller.loadMore,
  };
}

export type DashboardWorkbenchModel = ReturnType<typeof useDashboardWorkbench>;
