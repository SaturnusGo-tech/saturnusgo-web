import { useWorkspaceCapabilities } from "../../auth/spaces/capabilities/composition/useWorkspaceCapabilities";
import type { ReactNode } from "react";
import { WorkspaceMaintenanceProvider } from "../../test-cases/maintenance/composition/WorkspaceMaintenanceProvider";
import { CodexPluginsSettings } from "../../codex-employee/composition/settings/CodexPluginsSettings";
import { ImportCasesPage } from "../../test-cases/exchange/library/presentation/page/ImportCasesPage";
import { CustomFieldsPage } from "../../custom-fields/presentation/catalog/CustomFieldsPage";
import { workspaceViewAllowed } from "../../auth/managed/domain/features/workspace-view-access";
import { WorkspaceNotifications } from "../../notifications/composition/WorkspaceNotifications";
import { WorkspaceProfile } from "../../profile/composition/WorkspaceProfile";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";
import { CompanyFeatureUnavailable } from "../../auth/managed/presentation/permissions/CompanyFeatureUnavailable";
import { WorkspacePortfoliosStage } from "./portfolios/WorkspacePortfoliosStage";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { settingsSectionLink } from "../config/navigation/settings-section-route";
import { navigateWorkspace, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { DocumentationEntry } from "../../documentation/presentation/DocumentationEntry";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import type { DashboardDrill, DashboardDrillRow } from "../../dashboards/model/dashboard-analytics";
import { buildDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { buildWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { ApiTestingView } from "../api-testing/ApiTestingView";
import { ConfigView } from "../config/ConfigView";
import { BillingFeature } from "../../billing/composition/BillingFeature";
import { DashboardView } from "../dashboard/DashboardView";
import { HooksView } from "../hooks/HooksView";
import { ProjectOnboarding } from "../onboarding/ProjectOnboarding";
import { ReportsView } from "../reports/ReportsView";
import { WorkspaceRunsStage } from "./runs/WorkspaceRunsStage";
import { WorkspaceSuitesStage } from "./suites/WorkspaceSuitesStage";
import { SharedStepsView } from "../shared-steps/SharedStepsView";
import { WorkspaceLoadState } from "../workspace-state/WorkspaceLoadState";
import { WorkspaceCasesStage } from "./cases/WorkspaceCasesStage";
import { AttachmentLibrary } from "../../attachments/presentation/library/AttachmentLibrary";

export function WorkspaceStage({ model }: { model: WorkspaceModel }) {
  const { t } = useTmsLocale();
  const session = useOptionalTmsSession();
  const metadata = useWorkspaceCapabilities(model.data.workspace.id, !!session);
  const codexAvailable = !!metadata.value;
  const maintenance = (content: ReactNode) => <WorkspaceMaintenanceProvider model={model}>{content}</WorkspaceMaintenanceProvider>;
  async function selectDrillProject(projectId?: string) {
    if (projectId && projectId !== model.project?.id) await model.chooseProject(projectId);
  }
  async function openDashboardEntity(entity: "test_case" | "run" | "defect", drill: DashboardDrill) {
    await selectDrillProject(drill.projectId);
    if (entity === "test_case") {
      const filter = drill.filter.entity === "test_case" ? drill.filter : null;
      model.setCaseFilters({ type: filter?.type ?? "all", priority: "all", lifecycle: "all",
        tag: filter?.tag ?? "", includeArchived: false });
      model.setQuery(filter?.component ?? "");
      model.setView("cases");
    } else model.setView(entity === "run" ? "runs" : "reports");
  }
  async function openDashboardRow(row: DashboardDrillRow) {
    if (row.entity === "run" || row.entity === "run_item") {
      const runId = row.runId ?? row.id;
      const runItemId = row.runItemId ?? null;
      if (row.projectId === model.project?.id) model.openRun(runId, runItemId);
      else visitWorkspace(buildWorkspaceDeepLink(window.location.href, {
        workspaceId: model.data.workspace.id, projectId: row.projectId, view: "runs", runId, runItemId,
      }));
      return;
    }
    if (row.entity === "defect" && row.projectId !== model.project?.id) {
      visitWorkspace(buildDefectDeepLink(window.location.href, {
        projectId: row.projectId, defectId: row.id, includeArchived: Boolean(row.archivedAt),
      }));
      return;
    }
    await selectDrillProject(row.projectId);
    if (row.entity === "test_case") {
      model.setCaseFilters({ type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
      model.setQuery(""); model.setSelectedCaseId(row.id); model.setView("cases");
    } else model.openDefect(row.id, Boolean(row.archivedAt));
  }
  const exchange = model.project && (companyViewAvailable("imports", session?.companyCapabilities) ? <ImportCasesPage key={model.data.workspace.id} project={model.project}
    workspaceId={model.data.workspace.id} canManage={model.data.meta.authorization.capabilities.includes("test_case:manage") && model.data.meta.authorization.capabilities.includes("attachment:manage")}
    exportEnabled={model.connection === "connected"}
    initialFolderId={model.selectedFolderId}
    onBack={() => transitionContent(() => { navigateWorkspace(settingsSectionLink(window.location.href, "general")); model.setView("config"); })}
    onImported={async (projectId) => { model.folders.reload(); await model.loadProject(projectId ?? model.project!.id); }} />
    : <CompanyFeatureUnavailable onReturn={() => navigateWorkspace(settingsSectionLink(window.location.href, "general"))} />);
  if (!companyViewAvailable(model.view === "notifications" ? "config" : model.view, session?.companyCapabilities, codexAvailable)) return <CompanyFeatureUnavailable onReturn={() => model.setView("cases")} />;
  if (model.view === "profile") return session ? <WorkspaceProfile workspaceId={model.data.workspace.id} />
    : <CompanyFeatureUnavailable onReturn={() => model.setView("cases")} />;
  if (model.view === "help") return <DocumentationEntry />;
  if (model.view === "config" || model.view === "notifications") {
    return (
      <ConfigView key={model.data.workspace.id}
        billing={session && <BillingFeature workspaceId={model.data.workspace.id} preview={process.env.NODE_ENV !== "production" && session.subject === "preview:mercury"} onClose={() => model.setView("cases")} />}
        notifications={<WorkspaceNotifications workspaceId={model.data.workspace.id} />}
        plugins={<CodexPluginsSettings workspaceId={model.data.workspace.id} projectId={model.project?.id ?? ""} canManage={model.canManageIntegrations} capabilities={model.data.meta.authorization.capabilities} connected={model.connection === "connected"} />}
        environments={model.projectEnvironments}
        project={model.project}
        offline={model.connection === "demo"}
        onEnvironmentSaved={environment => model.setData(current => ({ ...current, environments:
          current.environments.some(item => item.id === environment.id)
            ? current.environments.map(item => item.id === environment.id ? environment : item)
            : [...current.environments, environment] }))}
        onToggleEnvironment={model.toggleEnvironment}
        workspaceId={model.data.workspace.id}
        canManageProject={model.data.meta?.authorization?.capabilities?.includes("project:manage") ?? false}
        onProjectUpdated={model.acceptProjectUpdate}
        onToggleProject={model.toggleProject}
        exchange={exchange}
      />
    );
  }
  if (model.connection === "loading" || model.connection === "error") {
    return (
      <WorkspaceLoadState
        failure={model.failure}
        onRetry={model.retryBootstrap}
      />
    );
  }
  if (!workspaceViewAllowed(model.view, model.data.meta.authorization.capabilities, codexAvailable)) return <CompanyFeatureUnavailable onReturn={() => model.setView("cases")} />;
  if (model.view === "files") return <AttachmentLibrary key={JSON.stringify([model.data.workspace.id, session?.subject])}
    workspaceId={model.data.workspace.id} subject={session?.subject ?? null} connected={model.connection === "connected"} />;
  if (model.view === "portfolios") return maintenance(<WorkspacePortfoliosStage model={model} />);
  if (model.view === "cases" && model.repositoryScope.aggregate) return maintenance(<WorkspaceCasesStage model={model} />);
  if (model.view === "api") return <ApiTestingView key={model.data.workspace.id}
    scope={{ workspaceId: model.data.workspace.id, projectId: model.projectId }} canManage={model.canManageIntegrations} />;
  if (model.view === "hooks" && (model.project || codexAvailable)) return <HooksView workspaceId={model.data.workspace.id} projectId={model.project?.id ?? ""}
    canManage={model.canManageIntegrations && !!model.project} capabilities={model.data.meta.authorization.capabilities} connected={model.connection === "connected"} />;
  if (!model.project) {
    return (
      <ProjectOnboarding
        canCreate={model.data.meta.authorization.capabilities.includes("project:manage")}
        onCreate={model.openNewProject}
      />
    );
  }
  if (model.view === "custom-fields") return <CustomFieldsPage key={`${model.data.workspace.id}:${model.project.id}`}
    workspaceId={model.data.workspace.id} projectId={model.project.id} connected={model.connection === "connected"}
    canManageFields={model.data.meta.authorization.capabilities.includes("project:manage")}
    canManageValues={model.data.meta.authorization.capabilities.includes("test_case:manage")} />;
  if (model.view === "imports") return exchange;
  if (model.view === "dashboard") {
    return (
      <DashboardView
        data={model.data}
        projectId={model.project.id}
        serverAnalytics={model.connection === "connected"}
        onOpenEntity={(entity, drill) => void openDashboardEntity(entity, drill)}
        onOpenRow={(row) => void openDashboardRow(row)}
        onCreateRun={(caseIds) => model.openRunDialog({ caseIds })}
      />
    );
  }
  if (model.view === "cases") {
    return maintenance(<WorkspaceCasesStage model={model} />);
  }
  if (model.view === "shared-steps") {
    return <SharedStepsView key={model.project.id} resource={model.sharedSteps} />;
  }
  if (model.view === "suites") return <WorkspaceSuitesStage key={`${model.data.workspace.id}:${model.project.id}`} model={model} />;
  if (model.view === "runs") return maintenance(<WorkspaceRunsStage model={model} />);
  return (
    <ReportsView connected={model.connection === "connected"} canComment={model.data.meta.authorization.capabilities.includes("defect:manage")} workspaceId={model.data.workspace.id} projectId={model.projectId} projectName={model.project.name}
      defects={model.reportDefects}
      runs={model.projectRuns}
      links={model.projectLinks}
      selectedDefectId={model.selectedDefectId}
      onSelectDefect={model.setSelectedDefectId}
      selectedDefectStatus={model.selectedDefectResource.status}
      onRetrySelectedDefect={model.selectedDefectResource.retry}
      onNew={() => model.setDialog("defect")}
      onOpenRun={model.openRun} defectRetest={model.defectRetest}
    />
  );
}
