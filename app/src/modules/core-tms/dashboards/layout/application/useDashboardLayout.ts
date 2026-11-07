"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { createLayoutSource } from "../data/layout-source";
import type { BoardScope, LayoutSource, LayoutState } from "../model/layout";
import { DashboardLayoutController } from "./DashboardLayoutController";

export function useDashboardLayout(scope: BoardScope) {
  const http = useTmsHttpClient();
  const source = useMemo(() => createLayoutSource(http), [http]);
  return useDashboardLayoutController(source, scope)!;
}

const disabledState: LayoutState = { loading: false, saving: false, board: null,
  draft: null, failure: null, retryPending: false };
const noSubscribe = () => () => undefined;
const noState = () => disabledState;

export function useDashboardLayoutController(source: LayoutSource | null, scope: BoardScope | null) {
  const workspaceId = scope?.workspaceId, projectId = scope?.projectId;
  const controller = useMemo(() => source && workspaceId && projectId ?
    new DashboardLayoutController(source, { workspaceId, projectId }, () => crypto.randomUUID()) : null,
  [source, workspaceId, projectId]);
  const state = useSyncExternalStore(controller?.subscribe ?? noSubscribe,
    controller?.getState ?? noState, controller?.getState ?? noState);
  useEffect(() => {
    if (!controller) return;
    void controller.load();
    return () => controller.dispose();
  }, [controller]);
  const hasDraft = Boolean(state.draft);
  useEffect(() => {
    if (!hasDraft) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasDraft]);
  return controller ? { ...state, controller } : null;
}
export type DashboardLayoutModel = ReturnType<typeof useDashboardLayout>;
