"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { continuationFromLocation, hasContinuationContext, scopedPlanContinuation } from "../domain/continuation-path";
import { takeBrowserContinuation } from "../application/browser-continuation";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
import { captureBrowserDesktopAttempt, takeBrowserDesktopAttempt } from "../desktop/browser-desktop-attempt";
import { DesktopRestartScreen } from "./DesktopAuthEntry";
type Props = { readonly children: ReactNode; readonly workspaceId?: string | null; readonly managedWorkspace?: boolean;
  readonly workspaceHandoff?: boolean; readonly deferBrowserContinuation?: boolean; readonly explicitContext?: boolean };
export function AuthContinuation({ children, workspaceId, managedWorkspace = false, workspaceHandoff = false, deferBrowserContinuation = false, explicitContext }: Props) {
  const [target, setTarget] = useState<string | null | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);
  const checked = useRef(false);
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    if (typeof window === "undefined") { setTarget(null); return; }
    if (managedWorkspace) captureBrowserDesktopAttempt(true);
    const desktop = takeBrowserDesktopAttempt(managedWorkspace ? workspaceId : undefined);
    if (desktop.status === "blocked") { setBlocked(true); return; }
    if (desktop.status === "redirect") { setTarget(desktop.path); window.location.replace(desktop.path); return; }
    const saved = deferBrowserContinuation ? null : takeBrowserContinuation(workspaceId);
    const current = continuationFromLocation(window.location);
    const explicit = explicitContext ?? (current && hasContinuationContext(current, window.location.origin));
    const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const origin = window.location.origin;
    const handoffPlan = workspaceHandoff && workspaceId && (
      scopedPlanContinuation(current, origin, workspaceId) ? current : scopedPlanContinuation(saved, origin, workspaceId) ? saved : null
    );
    const next = workspaceHandoff ? handoffPlan : !explicit ? saved : null;
    const destination = next && next !== here ? next : null;
    setTarget(destination);
    if (destination) window.location.replace(destination);
  }, [workspaceId, managedWorkspace, workspaceHandoff, deferBrowserContinuation, explicitContext]);
  return blocked ? <DesktopRestartScreen /> : target === null ? children : <TmsAuthState kind="loading" />;
}
