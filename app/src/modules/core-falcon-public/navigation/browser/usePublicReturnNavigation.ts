"use client";

import { useEffect, useState } from "react";
import { installedDesktopVersion } from "../../../core-tms/desktop-downloads/model/update";
import { PUBLIC_WORKSPACE_RETURN_KEY, workspaceReturnPath } from "../model/workspace-return";

type Destination = { desktop: boolean; workspace: string | null };

export function usePublicReturnNavigation(browserHome: string, browserBack = browserHome) {
  const [destination, setDestination] = useState<Destination | null>(null);
  useEffect(() => {
    const sync = () => {
      const origin = window.location.origin;
      const referrer = workspaceReturnPath(document.referrer, origin);
      let workspace = referrer;
      try {
        workspace ??= workspaceReturnPath(window.sessionStorage.getItem(PUBLIC_WORKSPACE_RETURN_KEY), origin);
        if (referrer) window.sessionStorage.setItem(PUBLIC_WORKSPACE_RETURN_KEY, referrer);
      } catch { /* Blocked storage still permits a trusted referrer or the workspace fallback. */ }
      setDestination({ desktop: Boolean(installedDesktopVersion(navigator.userAgent)), workspace });
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const workspace = destination?.workspace ?? "/work/";
  return {
    homeHref: destination?.desktop === false ? browserHome : workspace,
    backHref: destination?.workspace ?? (destination?.desktop === false ? browserBack : workspace),
    desktop: destination?.desktop ?? true,
  };
}
