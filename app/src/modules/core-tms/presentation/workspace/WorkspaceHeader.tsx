import { ApiScopeSelector } from "../../api-sources/scope/selector/ApiScopeSelector";
import { RepositoryScopeSelector } from "../../repository-scope/presentation/selector/RepositoryScopeSelector";
import { FolderOpen, SidebarMenuMobile } from "@openai/apps-sdk-ui/components/Icon";
import { Button } from "@heroui/button";
import { PiUploadSimple } from "react-icons/pi";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { workspaceDisplayName } from "../../localization/format/workspace/display-name";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { HistoryControls } from "./history/HistoryControls";
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
  const { languageTag, locale, t } = useTmsLocale();
  const session = useOptionalTmsSession();
  const workspace = model.data.workspace;
  const workspaceName = workspaceDisplayName({
    name: workspace.name,
    kind: session?.workspaceId === workspace.id ? session.workspaceKind : undefined,
  }, locale);
  const workspaceReady =
    model.connection === "connected" || model.connection === "demo";
  const ru = locale === "ru";
  const showImport = Boolean(model.project) && model.view === "cases" && !model.repositoryScope.aggregate
    && companyViewAvailable("imports", session?.companyCapabilities);
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

      {showImport && <div className={shellStyles.headerActions}>
        <Button type="button" size="sm" radius="full" variant="solid" className={shellStyles.importShortcut}
          data-testid="open-case-import" onPress={() => model.setView("imports")}
          isDisabled={!workspaceReady || !model.folders.canManage || model.folders.busy || model.dialog === "case"
            || !model.data.meta.authorization.capabilities.includes("attachment:manage")}
          aria-label={ru ? "Импорт тест-кейсов" : "Import test cases"}>
          <PiUploadSimple size={15} aria-hidden="true" />{ru ? "Импорт" : "Import"}
        </Button>
      </div>}
    </header>
  );
}
