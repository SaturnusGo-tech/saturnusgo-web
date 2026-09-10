"use client";

import { useEffect, useState } from "react";
import { visitWorkspace } from "../../../state/navigation/browser/workspace-history";

/** Hash navigation keeps legacy security links and browser Back working in both shells. */
export function useProfileScreen() {
  const [security, setSecurity] = useState(false);
  useEffect(() => {
    const sync = () => setSecurity(window.location.hash === "#security");
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  const navigate = (password: boolean) => {
    const url = new URL(window.location.href);
    url.hash = password ? "security" : "";
    visitWorkspace(`${url.pathname}${url.search}${url.hash}`);
  };
  return { security, navigate };
}
