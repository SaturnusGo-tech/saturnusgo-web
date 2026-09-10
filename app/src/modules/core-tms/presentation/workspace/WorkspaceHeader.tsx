import {
  CalendarDays,
  GitBranch,
  Menu,
  Server,
} from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { HistoryControls } from "./history/HistoryControls";
import { ProjectSelector } from "./project-selector/ProjectSelector";
import { transitionContent } from "./motion/transition/content-transition";
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
  const now = new Date();
  const today = now.toLocaleDateString(languageTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const localTime = now.toLocaleTimeString(languageTag, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekday = now.toLocaleDateString(languageTag, { weekday: "short" });

  return (
    <header className={shellStyles.header}>
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
      {(model.view === "portfolios" || model.view === "profile") || !model.project ? <div className={shellStyles.projectContext}><span className={shellStyles.workspaceName}>{model.data.workspace.name}</span></div> : <div className={shellStyles.projectContext}>
        <span className={shellStyles.projectEyebrow} aria-hidden="true">
          {t("header.project")}
        </span>
        <div className={shellStyles.projectSelectorSlot}>
          <ProjectSelector
            activeProjectId={model.project?.id ?? null}
            projects={model.projects}
            disabled={!workspaceReady}
            currentProjectLabel={t("header.currentProject")}
            createProjectLabel={model.project ? t("header.createProject") : t("header.createFirstProject")}
            onSelect={model.chooseProject}
            onCreate={model.openNewProject}
          />
        </div>
      </div>}

      {model.view !== "portfolios" && model.view !== "profile" && model.project && <div className={shellStyles.headerMeta}>
        <button type="button" className={shellStyles.headerMetaItem} onClick={editEnvironment} disabled={!workspaceReady}
          title={t("header.editEnvironment")} aria-label={`${t("header.editEnvironment")}: ${activeEnvironment}`}>
          <Server size={15} aria-hidden="true" />
          <span>
            <small>{t("header.environment")}</small>
            <strong>{activeEnvironment}</strong>
          </span>
        </button>
        <button type="button" className={shellStyles.headerMetaItem} onClick={openBuild} disabled={!workspaceReady}
          title={t("header.openBuild")} aria-label={`${t("header.openBuild")}: ${activeBuild}`}>
          <GitBranch size={15} aria-hidden="true" />
          <span>
            <small>{t("header.build")}</small>
            <strong>{activeBuild}</strong>
          </span>
        </button>
        <div className={shellStyles.headerClock} title={`${weekday}, ${today} ${localTime}`}>
          <CalendarDays size={15} aria-hidden="true" />
          <span>
            <strong>{localTime}</strong>
            <small>{today}</small>
          </span>
        </div>
      </div>}
    </header>
  );
}
