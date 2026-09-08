"use client";
import { useEffect, useState } from "react";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { defaultPreferences, parsePreferences, preferenceKey, type DashboardPreferences } from "./preferences";
export function useDashboardPreferences(workspace: string, project: string) {
  const { subject } = useTmsSession(); const key = preferenceKey(subject, workspace, project);
  const [state, setState] = useState({ key: "", value: defaultPreferences });
  const [stored, setStored] = useState(true);
  useEffect(() => {
    try { setState({ key, value: parsePreferences(window.localStorage.getItem(key)) }); setStored(true); }
    catch { setState({ key, value: { ...defaultPreferences } }); setStored(false); }
  }, [key]);
  const value = state.key === key ? state.value : defaultPreferences;
  const update = (patch: Partial<DashboardPreferences>) => setState(current => {
    const next = { ...(current.key === key ? current.value : defaultPreferences), ...patch };
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { setStored(false); }
    return { key, value: next };
  });
  return { value, update, stored };
}
