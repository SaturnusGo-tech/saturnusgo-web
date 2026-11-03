"use client";
import { useEffect, useState } from "react";
import { HISTORY_CHANGE, visitWorkspace } from "../../../state/navigation/browser/workspace-history";

/** Keep the selected case in the URL while opening the repository structure page. */
export function useFolderStructureScreen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setOpen(new URL(window.location.href).hash === "#folders");
    sync(); window.addEventListener("popstate", sync); window.addEventListener("hashchange", sync); window.addEventListener(HISTORY_CHANGE, sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); window.removeEventListener(HISTORY_CHANGE, sync); };
  }, []);
  function navigate(show: boolean) {
    const url = new URL(window.location.href); url.hash = show ? "folders" : "";
    visitWorkspace(`${url.pathname}${url.search}${url.hash}`);
  }
  return { open, show: () => navigate(true), close: () => navigate(false) };
}
