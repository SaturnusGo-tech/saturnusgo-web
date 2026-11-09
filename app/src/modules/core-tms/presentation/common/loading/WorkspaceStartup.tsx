"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FalconBrandMark } from "../../../../../shared/components/brand/FalconBrandMark";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "./workspace-startup.module.css";

const minimumIntroMs = 1500;
const introExitMs = 240;

type StartupContext = { covered: boolean; registerPending: () => () => void };
const WorkspaceStartupContext = createContext<StartupContext | null>(null);

export function useWorkspaceStartupCovered() {
  return useContext(WorkspaceStartupContext)?.covered ?? false;
}

export function useWorkspaceStartupPending(pending: boolean) {
  const startup = useContext(WorkspaceStartupContext);
  const covered = startup?.covered ?? false;
  const registerPending = startup?.registerPending;
  useEffect(() => {
    if (pending && covered) return registerPending?.();
  }, [pending, covered, registerPending]);
  return covered;
}

export function WorkspaceStartup({ children }: { children: ReactNode }) {
  const { t } = useTmsLocale();
  const [phase, setPhase] = useState<"showing" | "leaving" | "done">("showing");
  const [pending, setPending] = useState(0);
  const shownAt = useRef<number | null>(null);
  const covered = phase !== "done";
  const registerPending = useCallback(() => {
    setPending(count => count + 1);
    return () => setPending(count => count - 1);
  }, []);
  const context = useMemo(() => ({ covered, registerPending }), [covered, registerPending]);

  useEffect(() => {
    if (!covered) return;
    shownAt.current ??= performance.now();
    if (pending > 0) {
      if (phase === "leaving") setPhase("showing");
      return;
    }
    const delay = phase === "showing"
      ? Math.max(0, minimumIntroMs - (performance.now() - shownAt.current))
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : introExitMs;
    const timer = window.setTimeout(() => setPhase(phase === "showing" ? "leaving" : "done"), delay);
    return () => window.clearTimeout(timer);
  }, [covered, pending, phase]);

  const setContent = useCallback((element: HTMLDivElement | null) => {
    if (element) element.inert = covered;
  }, [covered]);

  return (
    <WorkspaceStartupContext.Provider value={context}>
      <div className={styles.content} ref={setContent} aria-hidden={covered || undefined}>{children}</div>
      {covered && <div className={styles.intro} data-testid="workspace-startup" data-phase={phase}
        role="status" aria-label={t("workspace.loading")} aria-busy="true">
        <div className={styles.artwork} aria-hidden="true">
          <FalconBrandMark intro />
        </div>
      </div>}
    </WorkspaceStartupContext.Provider>
  );
}
