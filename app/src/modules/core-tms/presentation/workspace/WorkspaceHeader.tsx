import {
  CalendarDays,
  GitBranch,
  Menu,
  Server,
} from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { ProjectSelector } from "./project-selector/ProjectSelector";
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
  const activeEnvironment =
    model.selectedRun?.environment.name ??
    model.projectEnvironments.find((item) => item.isDefault)?.name ??
    model.projectEnvironments[0]?.name ??
    "—";
  const activeBuild =
    model.selectedRun?.build ?? (model.project ? "local-current" : "—");
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

      <div className={shellStyles.projectContext}>
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
      </div>

      <div className={shellStyles.headerMeta}>
        <div className={shellStyles.headerMetaItem} title={`${t("header.environment")}: ${activeEnvironment}`}>
          <Server size={15} aria-hidden="true" />
          <span>
            <small>{t("header.environment")}</small>
            <strong>{activeEnvironment}</strong>
          </span>
        </div>
        <div className={shellStyles.headerMetaItem} title={`${t("header.build")}: ${activeBuild}`}>
          <GitBranch size={15} aria-hidden="true" />
          <span>
            <small>{t("header.build")}</small>
            <strong>{activeBuild}</strong>
          </span>
        </div>
        <div className={shellStyles.headerClock} title={`${weekday}, ${today} ${localTime}`}>
          <CalendarDays size={15} aria-hidden="true" />
          <span>
            <strong>{localTime}</strong>
            <small>{today}</small>
          </span>
        </div>
      </div>
    </header>
  );
}
