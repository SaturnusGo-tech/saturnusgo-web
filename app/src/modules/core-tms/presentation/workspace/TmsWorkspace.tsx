"use client";

import { WorkspacePeopleProvider } from "../../workspace/members/context/WorkspacePeopleContext";
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
import { VerificationQueueControl } from "../../runs/verification/presentation/queue/VerificationQueueControl";
import shellStyles from "./tms-shell.module.css";
import { useHistoryScroll } from "./history/useHistoryScroll";
import motion from "./motion/motion.module.css";
import "./motion/motion.css";
import { transitionContent } from "./motion/transition/content-transition";
import { usePageAppearance } from "./motion/usePageAppearance";

function LocalizedWorkspace() {
  const model = useWorkspaceModel();
  const pageRef = usePageAppearance([model.view, model.project?.id, model.selectedCaseId, model.selectedRunId, model.selectedRunItemId, model.selectedSuiteId, model.selectedDefectId, model.connection].join(":"));
  useHistoryScroll(pageRef);
  const { t } = useTmsLocale();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("tms.sidebar.collapsed.v1");
    setSidebarCollapsed(saved === "true");
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("tms.sidebar.collapsed.v1", String(next));
      return next;
    });
  }

  function changeView(next: typeof model.view) { transitionContent(() => selectView(next)); }

  function selectView(next: typeof model.view) {
    if (next === "cases" && model.dialog !== "case") model.setSelectedCaseId("");
    if (model.selectedDefectId) model.clearDefectSelection();
    if (next === "runs") {
      const activeRun = model.activeProjectRuns[0];
      if (activeRun) {
        model.setSelectedRunId(activeRun.id);
        model.setSelectedRunItemId(null);
      }
    }
    model.setView(next);
  }

  return (
    <WorkspacePeopleProvider workspaceId={model.data.workspace.id} offline={model.connection !== "connected"}>
    <div
      className={`${styles.app} ${shellStyles.shell}`}
      data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
      data-testid="tms-workspace"
    >
      <Navigation
        view={model.view}
        onChange={changeView}
        disabled={!model.project}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        onCreateCase={() => {
          transitionContent(() => { selectView("cases"); model.openNewCase(); });
        }}
        onCreateDefect={() => model.setDialog("defect")}
        activeRunCount={model.activeProjectRuns.length}
      />
      <div className={shellStyles.workspaceColumn}>
        <WorkspaceHeader
          model={model}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main className={`${styles.stage} ${shellStyles.stage}`}>
          {model.connection === "demo" && (
            <div
              className={styles.demoNotice}
              role="status"
              data-testid="demo-mode"
            >
              {t("workspace.demoNotice")}
            </div>
          )}
          <div className={`${styles.stageContent} ${motion.content}`} ref={pageRef} data-workspace-content>
            <WorkspaceStage model={model} />
          </div>
        </main>
      </div>
      <VerificationQueueControl state={model.verification} />
      {model.notice && (
        <div className={styles.toast} role="status" aria-live="polite">
          <CheckCircle2 size={17} />
          {model.notice}
        </div>
      )}
      <WorkspaceDialogs model={model} />
    </div></WorkspacePeopleProvider>
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
