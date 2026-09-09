import { WorkspacePortfoliosStage } from "./portfolios/WorkspacePortfoliosStage";
import { visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { DocumentationEntry } from "../../documentation/presentation/DocumentationEntry";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import type { DashboardDrill, DashboardDrillRow } from "../../dashboards/model/dashboard-analytics";
import { buildDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { buildWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { ApiTestingView } from "../api-testing/ApiTestingView";
import { ConfigView } from "../config/ConfigView";
import { DashboardView } from "../dashboard/DashboardView";
import { HooksView } from "../hooks/HooksView";
import { ProjectOnboarding } from "../onboarding/ProjectOnboarding";
import { ReportsView } from "../reports/ReportsView";
import { WorkspaceRunsStage } from "./runs/WorkspaceRunsStage";
import { SuitesView } from "../suites/SuitesView";
import { SharedStepsView } from "../shared-steps/SharedStepsView";
import { WorkspaceLoadState } from "../workspace-state/WorkspaceLoadState";
import { WorkspaceCasesStage } from "./cases/WorkspaceCasesStage";

export function WorkspaceStage({ model }: { model: WorkspaceModel }) {
  const { t } = useTmsLocale();
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
        projectId: row.projectId, defectId: row.id,
      }));
      return;
    }
    await selectDrillProject(row.projectId);
    if (row.entity === "test_case") {
      model.setCaseFilters({ type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
      model.setQuery(""); model.setSelectedCaseId(row.id); model.setView("cases");
    } else model.openDefect(row.id);
  }
  if (model.view === "help") return <DocumentationEntry />;
  if (model.connection === "loading" || model.connection === "error") {
    return (
      <WorkspaceLoadState
        failure={model.failure}
        demoAvailable={model.demoAvailable}
        onRetry={model.retryBootstrap}
        onUseDemo={model.useDevelopmentDemo}
      />
    );
  }
  if (model.view === "portfolios") return <WorkspacePortfoliosStage model={model} />;
  if (!model.project) {
    return (
      <ProjectOnboarding
        loading={false}
        onCreate={model.openNewProject}
      />
    );
  }
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
    return <WorkspaceCasesStage model={model} />;
  }
  if (model.view === "shared-steps") {
    return <SharedStepsView key={model.project.id} resource={model.sharedSteps} />;
  }
  if (model.view === "api") return <ApiTestingView key={`${model.data.workspace.id}:${model.project.id}`}
    scope={{ workspaceId: model.data.workspace.id, projectId: model.project.id }} canManage={model.canManageIntegrations} />;
  if (model.view === "suites") {
    return (
      <SuitesView
        key={`${model.data.workspace.id}:${model.project.id}`}
        workspaceId={model.data.workspace.id} projectId={model.project.id} projectName={model.project.name}
        suites={model.projectSuites}
        cases={model.projectCases}
        selectedDetail={model.selectedSuite}
        detailError={model.selectedSuiteDetailError} onRetryDetail={model.retrySelectedSuiteDetail}
        canManage={model.data.meta.authorization.capabilities.includes("suite:manage")}
        canRun={model.data.meta.authorization.capabilities.includes("run:manage")}
        onSelect={model.setSelectedSuiteId}
        onCreate={() => {
          model.setEditingSuiteId(null);
          model.setDialog("suite");
        }}
        onConfigure={(suiteId) => {
          model.setSelectedSuiteId(suiteId);
          model.setEditingSuiteId(suiteId);
          model.setDialog("suite");
        }}
        onRun={(suiteId) => model.openRunDialog({ suiteId })}
        onOpenCase={(testCase) => {
          model.setQuery("");
          model.setSelectedCaseId(testCase.id);
          model.setSelectedFolder(testCase.folderPath);
          model.setView("cases");
        }}
      />
    );
  }
  if (model.view === "config") {
    return (
      <ConfigView key={model.project.id}
        environments={model.projectEnvironments}
        project={model.project}
        onCreate={model.openNewEnvironment}
        onEditEnvironment={model.openEditEnvironment}
        onToggleEnvironment={model.toggleEnvironment}
        onEditProject={model.openEditProject}
        onToggleProject={model.toggleProject}
        exchangeEnabled={model.connection === "connected"}
        onCasesImported={async () => { await model.loadProject(model.project!.id); }}
      />
    );
  }
  if (model.view === "runs") return <WorkspaceRunsStage model={model} />;
  if (model.view === "hooks") return <HooksView workspaceId={model.data.workspace.id} projectId={model.project.id}
    canManage={model.canManageIntegrations} capabilities={model.data.meta.authorization.capabilities} connected={model.connection === "connected"} />;
  return (
    <ReportsView workspaceId={model.data.workspace.id} projectId={model.projectId}
      defects={model.reportDefects}
      runs={model.projectRuns}
      links={model.projectLinks}
      selectedDefectId={model.selectedDefectId}
      onSelectDefect={model.setSelectedDefectId}
      selectedDefectStatus={model.selectedDefectResource.status}
      onRetrySelectedDefect={model.selectedDefectResource.retry}
      onNew={() => model.setDialog("defect")}
      onOpenRun={model.openRun}
    />
  );
}
