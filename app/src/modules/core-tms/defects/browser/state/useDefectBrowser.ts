"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { createHttpDefectBrowser } from "../data/http-defect-browser";
import { createLocalDefectBrowser } from "../data/local-defect-browser";
import { DefectBrowserController } from "../application/DefectBrowserController";
import { subscribeDefectsChanged } from "../../application/defect-resource-events";
import { scheduleVisibleDefectRefresh } from "../../../state/defect-refresh/visible-defect-refresh";
import { emptyDefectBrowser, type DefectBrowserScope } from "../model/defect-browser";

export function useDefectBrowser({ workspaceId, projectId, query, connected, defects, severitySort, selectedDefectId, scope = "active" }: {
  workspaceId?: string; projectId?: string; query: string; connected: boolean;
  defects: Defect[]; selectedDefectId?: string | null; severitySort?: "asc" | "desc" | null;
  scope?: DefectBrowserScope;
}) {
  const http = useTmsHttpClient();
  const source = useMemo(() => connected ? createHttpDefectBrowser(http) : createLocalDefectBrowser(defects),
    [http, connected, connected ? null : defects]);
  const controller = useMemo(() => new DefectBrowserController(source), [source]);
  const key = JSON.stringify([workspaceId ?? "", projectId ?? "", query.trim(), severitySort ?? null, scope]);
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  useEffect(() => {
    controller.reset();
    const timer = setTimeout(() => {
      if (projectId) controller.configure(key, { projectId, q: query.trim(), severitySort, scope });
    }, query.trim() ? 225 : 0);
    return () => { clearTimeout(timer); controller.reset(); };
  }, [controller, key, projectId]);
  const previous = useRef(new Map<string, string>());
  useEffect(() => {
    const current = new Map(defects.filter((item) => item.projectId === projectId).map((item) =>
      [item.id, JSON.stringify([item.component, item.status, item.severity, item.priority,
        item.title, item.description, item.assigneeIdentityId, item.labels])]));
    const changed = [...current].some(([id, signature]) => previous.current.has(id)
      ? previous.current.get(id) !== signature : previous.current.size > 0 && id !== selectedDefectId);
    previous.current = current;
    if (connected && changed) controller.refresh();
  }, [controller, connected, defects, projectId, selectedDefectId]);
  useEffect(() => {
    if (!connected) return;
    const refresh = () => { if (document.visibilityState === "visible") controller.refresh(); };
    const cancel = scheduleVisibleDefectRefresh(refresh);
    const unsubscribe = subscribeDefectsChanged((changedProject) => { if (changedProject === projectId) refresh(); });
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { cancel(); unsubscribe(); window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh); };
  }, [connected, controller, projectId]);
  const visible = state.key === key ? state : { ...emptyDefectBrowser(key),
    groupsStatus: projectId ? "loading" as const : "idle" as const };
  return { ...visible, loadMoreGroups: controller.loadMoreGroups, retryGroups: controller.retryGroups,
    openComponent: controller.openComponent, loadMoreComponent: controller.loadMoreComponent,
    retryComponent: controller.retryComponent };
}
