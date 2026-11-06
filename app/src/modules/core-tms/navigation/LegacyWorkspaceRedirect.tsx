"use client";
import { useEffect } from "react";
import { TessiqLoader } from "../presentation/common/loading/TessiqLoader";
import styles from "../auth/presentation/state/auth-state.module.css";
import { WORKSPACE_PATH } from "./workspace-route";
export function LegacyWorkspaceRedirect() {
  useEffect(() => { window.location.replace(`${WORKSPACE_PATH}${window.location.search}${window.location.hash}`); }, []);
  return <main className={styles.viewport}><TessiqLoader label="Loading Falcon" testId="workspace-route-loading" /></main>;
}
