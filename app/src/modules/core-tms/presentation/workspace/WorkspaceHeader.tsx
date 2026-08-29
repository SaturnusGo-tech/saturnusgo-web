import {
  CalendarDays,
  Menu,
} from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import styles from "../../tms.module.css";
import { ProjectSelector } from "./project-selector/ProjectSelector";

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
    <header className={styles.tabsBar}>
      <button
        className={styles.homeButton}
        onClick={onToggleSidebar}
        aria-label={t("header.toggleNavigation")}
        title={t("header.toggleNavigation")}
        aria-controls="tms-navigation"
        aria-expanded={!sidebarCollapsed}
      >
        <Menu size={21} />
      </button>
      <button
        className={styles.brandButton}
        onClick={() => model.setView("dashboard")}
        aria-label={t("header.dashboardAria")}
      >
        <span className={styles.saturnLogo} aria-hidden="true" />
      </button>
      <ProjectSelector
        activeProjectId={model.project?.id ?? null}
        projects={model.projects}
        disabled={!workspaceReady}
        currentProjectLabel={t("header.currentProject")}
        createProjectLabel={model.project ? t("header.createProject") : t("header.createFirstProject")}
        onSelect={model.chooseProject}
        onCreate={model.openNewProject}
      />
      <div className={styles.headerMeta}>
        <div className={styles.headerMetaItem}>
          <span>{t("header.environment")}</span>
          <strong>{activeEnvironment}</strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>{t("header.build")}</span>
          <strong>{activeBuild}</strong>
        </div>
        <div className={styles.headerClock}>
          <CalendarDays size={17} />
          <span>
            <strong>{today}</strong>
            <small>
              {weekday} {localTime}
            </small>
          </span>
        </div>
      </div>
    </header>
  );
}
