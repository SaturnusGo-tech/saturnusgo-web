import { ApiScopeSelector } from "../../api-sources/scope/selector/ApiScopeSelector";
import { RepositoryScopeSelector } from "../../repository-scope/presentation/selector/RepositoryScopeSelector";
import {
  GitBranch,
  Menu,
  Server,
} from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { HistoryControls } from "./history/HistoryControls";
import { ProjectSelector } from "./project-selector/ProjectSelector";
import { transitionContent } from "./motion/transition/content-transition";
import { RunClock } from "../runs/clock/RunClock";
import { RunHeaderBuilds } from "../../runs/builds/presentation/header/RunHeaderBuilds";
import shellStyles from "./tms-shell.module.css";

export function WorkspaceHeader({
  model,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  model: WorkspaceModel;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { languageTag, t } = useTmsLocale();
  const workspaceReady =
    model.connection === "connected" || model.connection === "demo";
  const environment = model.selectedRun
    ? model.projectEnvironments.find((item) => item.id === model.selectedRun?.environment.id)
    : model.projectEnvironments.find((item) => item.isDefault && item.status === "active") ??
      model.projectEnvironments.find((item) => item.status === "active");
  const activeEnvironment = environment?.name ?? model.selectedRun?.environment.name ?? "—";
  const build = model.selectedRun?.build?.trim();
  const activeBuild = !build || /^local[- ]current$/i.test(build) ? "—" : build;
  const activeRun = model.view === "runs" ? model.selectedRun : null;
  function editEnvironment() {
    if (environment) void model.openEditEnvironment(environment.id);
    else model.openNewEnvironment();
  }
  function openBuild() {
    transitionContent(() => {
      if (model.selectedRun) model.openRun(model.selectedRun.id);
      else model.setView("runs");
    });
  }
  return (
    <header className={`${shellStyles.header} ${activeRun ? shellStyles.runHeader : ""}`}>
      <button
        type="button"
        className={shellStyles.mobileNavigationButton}
        onClick={onToggleSidebar}
        aria-label={t("header.toggleNavigation")}
        title={t("header.toggleNavigation")}
        aria-controls="tms-navigation"
        aria-expanded={!sidebarCollapsed}
      >
        <Menu size={19} aria-hidden="true" />
      </button>

      <HistoryControls />
      {(model.view === "portfolios" || model.view === "profile" || model.view === "notifications") || (!model.project && model.view !== "cases" && model.view !== "api") ? <div className={shellStyles.projectContext}><span className={shellStyles.workspaceName}>{model.data.workspace.name}</span></div> : <div className={shellStyles.projectContext}>
        <span className={shellStyles.projectEyebrow} aria-hidden="true">
          {model.view === "api" ? (languageTag.startsWith("ru") ? "Область" : "Scope") : model.view === "cases" && model.repositoryScope.portfolioId ? (languageTag.startsWith("ru") ? "Портфель" : "Portfolio") : t("header.project")}
        </span>
        <div className={shellStyles.projectSelectorSlot}>
          {model.view === "api" ? <ApiScopeSelector model={model} /> : model.view === "cases" ? <RepositoryScopeSelector model={model} /> : <ProjectSelector
            activeProjectId={model.project?.id ?? null}
            projects={model.projects}
            disabled={!workspaceReady}
            currentProjectLabel={t("header.currentProject")}
            loadingProjectLabel={t("common.loading")}
            createProjectLabel={model.project ? t("header.createProject") : t("header.createFirstProject")}
            onSelect={model.chooseProject}
            onCreate={model.openNewProject}
          />}
        </div>
      </div>}

      {model.view !== "api" && model.view !== "portfolios" && model.view !== "profile" && model.view !== "notifications" && !model.repositoryScope.aggregate && model.project && <div className={shellStyles.headerMeta}>
        {model.view === "runs" && model.selectedRun && <div className={shellStyles.runTime}><RunClock run={model.selectedRun} /></div>}
        <button type="button" className={`${shellStyles.headerMetaItem} ${activeRun ? shellStyles.runEnvironment : ""}`} onClick={editEnvironment} disabled={!workspaceReady}
          title={t("header.editEnvironment")} aria-label={`${t("header.editEnvironment")}: ${activeEnvironment}`}>
          <Server size={15} aria-hidden="true" />
          <span>
            {!activeRun && <small>{t("header.environment")}</small>}
            <strong>{activeEnvironment}</strong>
          </span>
        </button>
        {activeRun?.platformBuilds?.length ? <RunHeaderBuilds key={activeRun.id} builds={activeRun.platformBuilds} disabled={!workspaceReady} /> : (!activeRun || activeBuild !== "—") && <button type="button" className={shellStyles.headerMetaItem} onClick={openBuild} disabled={!workspaceReady}
          title={t("header.openBuild")} aria-label={`${t("header.openBuild")}: ${activeBuild}`}>
          <GitBranch size={15} aria-hidden="true" />
          <span>
            <small>{t("header.build")}</small>
            <strong>{activeBuild}</strong>
          </span>
        </button>}
      </div>}
    </header>
  );
}
