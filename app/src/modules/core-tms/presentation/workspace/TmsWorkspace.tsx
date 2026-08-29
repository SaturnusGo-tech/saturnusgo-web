"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { TmsAuthBoundary } from "../../auth/presentation/boundary/TmsAuthBoundary";
import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useWorkspaceModel } from "../../state/model/useWorkspaceModel";
import { Navigation } from "../navigation/Navigation";
import { WorkspaceDialogs } from "../workspace-dialogs/WorkspaceDialogs";
import { WorkspaceStage } from "../workspace-stage/WorkspaceStage";
import styles from "../../tms.module.css";
import { WorkspaceHeader } from "./WorkspaceHeader";

function LocalizedWorkspace() {
  const model = useWorkspaceModel();
  const { t } = useTmsLocale();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useEffect(() => {
    const saved = window.localStorage.getItem("tms.sidebar.collapsed.v1");
    setSidebarCollapsed(saved === null || saved === "true");
  }, []);
  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("tms.sidebar.collapsed.v1", String(next));
      return next;
    });
  }
  return (
    <div className={styles.app} data-testid="tms-workspace">
      <WorkspaceHeader
        model={model}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
      <div className={`${styles.frame} ${sidebarCollapsed ? styles.frameCollapsed : ""}`}>
        <Navigation
          view={model.view}
          onChange={model.setView}
          disabled={!model.project}
          collapsed={sidebarCollapsed}
        />
        <main className={styles.stage}>
          {model.connection === "demo" && (
            <div
              className={styles.demoNotice}
              role="status"
              data-testid="demo-mode"
            >
              {t("workspace.demoNotice")}
            </div>
          )}
          <div className={styles.stageContent}>
            <WorkspaceStage model={model} />
          </div>
        </main>
      </div>
      {model.notice && (
        <div className={styles.toast} role="status" aria-live="polite">
          <CheckCircle2 size={17} />
          {model.notice}
        </div>
      )}
      <WorkspaceDialogs model={model} />
    </div>
  );
}

export default function TmsWorkspace() {
  return (
    <TmsLocaleProvider>
      <TmsAuthBoundary>
        <LocalizedWorkspace />
      </TmsAuthBoundary>
    </TmsLocaleProvider>
  );
}
