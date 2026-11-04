"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { continuationFromLocation, hasContinuationContext } from "../domain/continuation-path";
import { takeBrowserContinuation } from "../application/browser-continuation";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
export function AuthContinuation({ children, workspaceId }: { readonly children: ReactNode; readonly workspaceId?: string | null }) {
  const [target, setTarget] = useState<string | null | undefined>(undefined);
  const checked = useRef(false);
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    if (typeof window === "undefined") { setTarget(null); return; }
    const saved = takeBrowserContinuation(workspaceId);
    const current = continuationFromLocation(window.location);
    const explicit = current && hasContinuationContext(current, window.location.origin);
    const destination = saved && !explicit && saved !== `${window.location.pathname}${window.location.search}${window.location.hash}` ? saved : null;
    setTarget(destination);
    if (destination) window.location.replace(destination);
  }, [workspaceId]);
  return target === null ? children : <TmsAuthState kind="loading" />;
}
