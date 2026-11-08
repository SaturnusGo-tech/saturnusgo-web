"use client";

import { FolderAppearanceProvider } from "../../folders/presentation/appearance/context/FolderAppearanceProvider";
import { WorkspaceConnectorProvider } from "../../connectors/application/context/WorkspaceConnectorContext";
import { WorkspacePeopleProvider } from "../../workspace/members/context/WorkspacePeopleContext";
import { useEffect, useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useWorkspaceModel } from "../../state/model/useWorkspaceModel";
import { Navigation } from "../navigation/Navigation";
import { WorkspaceDialogs } from "../workspace-dialogs/WorkspaceDialogs";
import { useProductDocsAccess } from "../../product-docs/composition/useProductDocsAccess";
import { ProductDocsWorkspace } from "../../product-docs/composition/ProductDocsWorkspace";
import { CompanyFeatureUnavailable } from "../../auth/managed/presentation/permissions/CompanyFeatureUnavailable";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { WorkspaceStage } from "../workspace-stage/WorkspaceStage";
import { GuidePanelProvider } from "../../documentation/panel/GuidePanelProvider";
import guideStyles from "../../documentation/panel/guide-panel.module.css";
import styles from "../../tms.module.css";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { VerificationQueueControl } from "../../runs/verification/presentation/queue/VerificationQueueControl";
import shellStyles from "./tms-shell.module.css";
import { useHistoryScroll } from "./history/useHistoryScroll";
import motion from "./motion/motion.module.css";
import "./motion/motion.css";
import { transitionContent } from "./motion/transition/content-transition";
import { usePageAppearance } from "./motion/usePageAppearance";
import appearance from "./appearance/glass.module.css";
import { WorkspaceUiProvider } from "./ui/WorkspaceUiProvider";

const glassEnabled = process.env.NEXT_PUBLIC_FALCON_GLASS_EXPERIMENT !== "false";

export function LocalizedWorkspace() {
  const model = useWorkspaceModel();
  const pageRef = usePageAppearance([model.view, model.project?.id, model.repositoryScope.key, model.connection].join(":"));
  useHistoryScroll(pageRef);
  const { locale, languageTag, t } = useTmsLocale();
  const docs = useProductDocsAccess(model.data.workspace.id, model.project?.id ?? "", model.connection === "connected");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("tms.sidebar.collapsed.v1");
      if (saved !== null) setSidebarCollapsed(saved === "true");
    } catch { /* The rail remains usable when browser storage is unavailable. */ }
  }, []);

  function changeSidebar(next: boolean) {
    setSidebarCollapsed(next);
    try { window.localStorage.setItem("tms.sidebar.collapsed.v1", String(next)); } catch { /* Session-only preference. */ }
  }

  function toggleSidebar() { changeSidebar(!sidebarCollapsed); }

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
    <WorkspaceUiProvider locale={languageTag} notice={model.notice}>
    <FolderAppearanceProvider resource={model.folders} workspaceId={model.data.workspace.id} projectId={model.project?.id}><WorkspacePeopleProvider workspaceId={model.data.workspace.id} offline={model.connection !== "connected"}>
    <WorkspaceConnectorProvider workspaceId={model.data.workspace.id} projectId={model.project?.id ?? ""} active={model.connection === "connected" && !!model.project && model.data.meta.authorization.capabilities.includes("integration:read")}>
    <div
      className={`${styles.app} ${shellStyles.shell} ${glassEnabled ? appearance.glass : ""}`}
      data-appearance={glassEnabled ? "glass" : undefined}
      data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
      data-testid="tms-workspace"
    >
      <Navigation
        view={model.view}
        onChange={changeView}
        disabled={!model.project}
        connected={model.connection === "connected"}
        collapsed={sidebarCollapsed}
        onCollapsedChange={changeSidebar}
        workspaceId={model.data.workspace.id}
        activeRunCount={model.activeProjectRuns.length}
        productDocs={docs.enabled}
        userCapabilities={model.data.meta.authorization.capabilities}
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
          <div className={`${styles.stageContent} ${motion.content} ${guideStyles.workspaceContent}`} ref={pageRef} data-workspace-content>
            <GuidePanelProvider scope={JSON.stringify([model.data.workspace.id, model.project?.id, model.view])} contentRef={pageRef}>
              <ProductDocsWorkspace workspace={model} api={docs.api} enabled={docs.enabled} scope={docs.scope}
                visible={model.view === "product-docs"} projectName={model.project?.name} contentRef={pageRef} onOpenDefect={model.openDefect} activity={model.data.activity}
                onCreateCase={model.data.meta.authorization.capabilities.includes("test_case:manage") ? (requirement) => {
                  if (model.caseSubmitting) return;
                  selectView("cases");
                  if (model.dialog === "case") {
                    model.notify(locale === "ru" ? "Сначала завершите редактирование открытого кейса."
                      : "Finish editing the open case first.");
                    return;
                  }
                  model.openNewCase("/", requirement);
                } : undefined}
                fallback={docs.pending || model.connection === "loading" ? <TessiqLoader pane label={t("common.loading")} />
                  : <CompanyFeatureUnavailable onReturn={() => changeView("cases")} />}>
                <WorkspaceStage model={model} />
              </ProductDocsWorkspace>
            </GuidePanelProvider>
          </div>
        </main>
        <VerificationQueueControl state={model.verification} workspaceId={model.data.workspace.id} />
      </div>
      <WorkspaceDialogs model={model} />
    </div></WorkspaceConnectorProvider></WorkspacePeopleProvider></FolderAppearanceProvider>
    </WorkspaceUiProvider>
  );
}
