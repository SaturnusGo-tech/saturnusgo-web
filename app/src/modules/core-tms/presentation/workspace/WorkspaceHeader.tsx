import { ApiScopeSelector } from "../../api-sources/scope/selector/ApiScopeSelector";
import { RepositoryScopeSelector } from "../../repository-scope/presentation/selector/RepositoryScopeSelector";
import { FolderOpen, PlusSquareAdd, SidebarMenuMobile } from "@openai/apps-sdk-ui/components/Icon";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { workspaceDisplayName } from "../../localization/format/workspace/display-name";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { HistoryControls } from "./history/HistoryControls";
import { ProjectSelector } from "./project-selector/ProjectSelector";
import { transitionContent } from "./motion/transition/content-transition";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import { ENVIRONMENT_SETTINGS_OPEN, settingsSectionLink } from "../config/navigation/settings-section-route";
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
  const { languageTag, locale, t } = useTmsLocale();
  const session = useOptionalTmsSession();
  const workspace = model.data.workspace;
  const workspaceName = workspaceDisplayName({
    name: workspace.name,
    kind: session?.workspaceId === workspace.id ? session.workspaceKind : undefined,
  }, locale);
  const workspaceReady =
    model.connection === "connected" || model.connection === "demo";
  function editEnvironment() {
    transitionContent(() => {
      model.closeResourceEditors(); model.setDialog(null);
      navigateWorkspace(settingsSectionLink(window.location.href, "environments"));
      model.setView("config");
      window.dispatchEvent(new Event(ENVIRONMENT_SETTINGS_OPEN));
    });
  }
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
        <SidebarMenuMobile width={22} height={22} aria-hidden="true" />
      </button>

      <HistoryControls />
      <FolderOpen className={shellStyles.contextIcon} width={22} height={22} aria-hidden="true" />
      {(model.view === "portfolios" || model.view === "profile" || model.view === "notifications") || (!model.project && model.view !== "cases" && model.view !== "api") ? <div className={shellStyles.projectContext}><span className={shellStyles.workspaceName}>{workspaceName}</span></div> : <div className={shellStyles.projectContext}>
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

      {model.project && (model.view === "dashboard" || model.view === "cases") && <button type="button" className={shellStyles.environmentShortcut}
        onClick={editEnvironment} disabled={!workspaceReady} data-testid="open-environments"
        title={languageTag.startsWith("ru") ? "Открыть окружения" : "Open environments"}
        aria-label={languageTag.startsWith("ru") ? "Открыть окружения" : "Open environments"}>
        <PlusSquareAdd width={23} height={23} aria-hidden="true" />
      </button>}
    </header>
  );
}
