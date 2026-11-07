"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { personalViewSource } from "./data/personal-view-source";
import { defaultPreferences, parsePreferences, preferenceKey, readLegacyPreferences, type DashboardPreferences } from "./preferences";
import { DashboardPreferenceSync } from "./sync/dashboard-preference-sync";
import { watchDashboardView } from "./sync/watch-dashboard-view";

export function useDashboardPreferences(workspaceId: string, projectId: string, connected: boolean) {
  const http = useTmsHttpClient();
  const { subject } = useTmsSession();
  const key = preferenceKey(subject, workspaceId, projectId);
  const controller = useMemo(() => new DashboardPreferenceSync(
    personalViewSource(http, { workspaceId, projectId }, "preferences"), () => crypto.randomUUID(),
  ), [http, key, workspaceId, projectId]);
  const synced = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [local, setLocal] = useState({ key: "", value: defaultPreferences, stored: true });
  useEffect(() => {
    let raw: string | null = null;
    let stored = true;
    try { raw = window.localStorage.getItem(key); } catch { stored = false; }
    if (!connected) {
      setLocal({ key, value: parsePreferences(raw), stored });
      return;
    }
    // Preexisting preview or anonymous browser context has no verified owner.
    controller.start(subject && raw ? readLegacyPreferences(raw) : null);
    const stopWatching = watchDashboardView(() => void controller.refresh());
    return () => { stopWatching(); controller.stop(); };
  }, [key, subject, connected, controller]);
  if (connected) return { ...synced, update: controller.update, refresh: controller.refresh };
  const value = local.key === key ? local.value : defaultPreferences;
  const update = (patch: Partial<DashboardPreferences>) => {
    setLocal(current => {
      const next = { ...(current.key === key ? current.value : defaultPreferences), ...patch };
      let stored = true;
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { stored = false; }
      return { key, value: next, stored };
    });
  };
  return { value, update, stored: local.stored, ready: local.key === key, refresh: () => undefined };
}
