"use client";

import { CheckCircle2 } from "lucide-react";
import { useWorkspaceModel } from "../../state/model/useWorkspaceModel";
import { Navigation } from "../navigation/Navigation";
import { WorkspaceDialogs } from "../workspace-dialogs/WorkspaceDialogs";
import { WorkspaceStage } from "../workspace-stage/WorkspaceStage";
import styles from "../../tms.module.css";
import { WorkspaceHeader } from "./WorkspaceHeader";

export default function TmsWorkspace() {
  const model = useWorkspaceModel();
  return (
    <div className={styles.app} data-testid="tms-workspace">
      <WorkspaceHeader model={model} />
      <div className={styles.frame}>
        <Navigation
          view={model.view}
          onChange={model.setView}
          disabled={!model.project}
        />
        <main className={styles.stage}>
          {model.connection === "demo" && (
            <div className={styles.demoNotice} role="status" data-testid="demo-mode">
              Development demo · changes stay in this browser
            </div>
          )}
          <WorkspaceStage model={model} />
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
