"use client";

import { useEffect } from "react";
import { PUBLIC_WORKSPACE_RETURN_KEY, workspaceReturnPath } from "../model/workspace-return";

/** Capture the latest selectors before document or client navigation leaves the app. */
export function PublicNavigationTracker() {
  useEffect(() => {
    const remember = () => {
      const path = workspaceReturnPath(window.location.href, window.location.origin);
      if (!path) return;
      try { window.sessionStorage.setItem(PUBLIC_WORKSPACE_RETURN_KEY, path); }
      catch { /* Private or disabled storage must never block navigation. */ }
    };
    remember();
    window.addEventListener("click", remember, true);
    window.addEventListener("pagehide", remember);
    window.addEventListener("popstate", remember);
    return () => {
      window.removeEventListener("click", remember, true);
      window.removeEventListener("pagehide", remember);
      window.removeEventListener("popstate", remember);
    };
  }, []);
  return null;
}
