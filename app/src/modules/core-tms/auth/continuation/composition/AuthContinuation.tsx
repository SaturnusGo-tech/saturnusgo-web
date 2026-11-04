"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { takeBrowserContinuation } from "../application/browser-continuation";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
export function AuthContinuation({ children, workspaceId }: { readonly children: ReactNode; readonly workspaceId?: string | null }) {
  const [target, setTarget] = useState<string | null | undefined>(undefined);
  const checked = useRef(false);
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    const saved = takeBrowserContinuation(workspaceId);
    const destination = saved && saved !== `${window.location.pathname}${window.location.search}${window.location.hash}` ? saved : null;
    setTarget(destination);
    if (destination) window.location.replace(destination);
  }, [workspaceId]);
  return target === null ? children : <TmsAuthState kind="loading" />;
}
