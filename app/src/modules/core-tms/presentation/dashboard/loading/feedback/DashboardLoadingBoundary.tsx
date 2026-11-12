"use client";

import { useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { FalconBrandMark } from "../../../../../../shared/components/brand/FalconBrandMark";
import { useWorkspaceStartupPending } from "../../../common/loading/WorkspaceStartup";
import { useLoadingFeedback } from "../../../common/loading/feedback/useLoadingFeedback";
import { WorkspaceHeaderActionsHost } from "../../../workspace/header-actions/WorkspaceHeaderActions";
import styles from "./dashboard-loading-boundary.module.css";

const exitMs = 240;
type Phase = "idle" | "visible" | "leaving";

export function DashboardLoadingBoundary({ pending, label, children }: {
  pending: boolean;
  label: string;
  children: ReactNode;
}) {
  const inheritedHeaderHost = useContext(WorkspaceHeaderActionsHost);
  const startupCovered = useWorkspaceStartupPending(pending);
  const visible = useLoadingFeedback(pending && !startupCovered);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!preference) return;
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (startupCovered) {
      if (phase !== "idle") setPhase("idle");
      return;
    }
    if (visible || (pending && phase === "leaving")) {
      if (phase !== "visible") setPhase("visible");
      return;
    }
    if (pending || phase === "idle") return;
    if (reducedMotion) {
      setPhase("idle");
      return;
    }
    if (phase === "visible") {
      setPhase("leaving");
      return;
    }
    const timer = window.setTimeout(() => setPhase("idle"), exitMs);
    return () => window.clearTimeout(timer);
  }, [pending, visible, phase, startupCovered, reducedMotion]);

  const covered = pending || visible || phase !== "idle";
  const setContent = useCallback((element: HTMLDivElement | null) => {
    if (element) element.inert = covered;
  }, [covered]);

  return <div className={styles.boundary} data-dashboard-loading-boundary data-covered={covered || undefined}
    aria-busy={covered || undefined}>
    <div ref={setContent} className={styles.content} data-dashboard-loading-content
      data-covered={covered || undefined} aria-hidden={covered || undefined}>
      <WorkspaceHeaderActionsHost.Provider value={covered ? null : inheritedHeaderHost}>
        {children}
      </WorkspaceHeaderActionsHost.Provider>
    </div>
    {!startupCovered && (visible || phase !== "idle") && <section className={styles.feedback}
      data-testid="dashboard-loading" data-phase={phase === "leaving" ? "leaving" : "visible"}
      role="status" aria-label={label} aria-busy="true">
      <FalconBrandMark className={styles.artwork} intro />
    </section>}
  </div>;
}
