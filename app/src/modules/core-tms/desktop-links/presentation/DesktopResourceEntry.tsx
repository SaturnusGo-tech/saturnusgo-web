"use client";

import { useEffect, useRef } from "react";
import { browserResourceOpener } from "../application/desktop-resource-open";

export function DesktopResourceEntry() {
  const opener = useRef<ReturnType<typeof browserResourceOpener> | null>(null);
  useEffect(() => {
    opener.current ??= browserResourceOpener();
    // Capture the original link before workspace initialization rewrites its
    // selection. Only a new document entry can offer an automatic native launch.
    const href = window.location.href;
    const offer = () => { if (document.visibilityState !== "hidden") opener.current?.(href, "automatic"); };
    offer();
    document.addEventListener("visibilitychange", offer);
    return () => document.removeEventListener("visibilitychange", offer);
  }, []);
  return null;
}
