"use client";
import { useEffect } from "react";
import { WORKSPACE_PATH } from "./workspace-route";
export function LegacyWorkspaceRedirect() {
  useEffect(() => { window.location.replace(`${WORKSPACE_PATH}${window.location.search}${window.location.hash}`); }, []);
  return null;
}
