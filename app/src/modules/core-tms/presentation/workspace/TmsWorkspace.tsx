"use client";

import { CheckCircle2 } from "lucide-react";
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
            <div
              className={styles.demoNotice}
              role="status"
              data-testid="demo-mode"
            >
              {t("workspace.demoNotice")}
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

export default function TmsWorkspace() {
  return (
    <TmsLocaleProvider>
      <LocalizedWorkspace />
    </TmsLocaleProvider>
  );
}
