import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import type { DashboardDrill, DashboardDrillRow } from "../../dashboards/model/dashboard-analytics";
import { buildDefectDeepLink } from "../../defects/navigation/defect-deep-link";
import { ApiTestingView } from "../api-testing/ApiTestingView";
import { ConfigView } from "../config/ConfigView";
import { DashboardView } from "../dashboard/DashboardView";
import { HooksView } from "../hooks/HooksView";
import { IntegrationsView } from "../integrations/IntegrationsView";
import { ProjectOnboarding } from "../onboarding/ProjectOnboarding";
import { ReportsView } from "../reports/ReportsView";
import { RunsView } from "../runs/RunsView";
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
    if (row.entity === "defect" && row.projectId !== model.project?.id) {
      window.location.assign(buildDefectDeepLink(window.location.href, {
        projectId: row.projectId, defectId: row.id,
      }));
      return;
    }
    await selectDrillProject(row.projectId);
    if (row.entity === "test_case") {
      model.setCaseFilters({ type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
      model.setQuery(""); model.setSelectedCaseId(row.id); model.setView("cases");
    } else if (row.entity === "run" || row.entity === "run_item") {
      model.setSelectedRunId(row.runId ?? row.id);
      model.setSelectedRunItemId(row.runItemId ?? null);
      model.setView("runs");
    } else model.openDefect(row.id);
  }
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
        onCreate={() => model.setDialog("dashboard")}
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
    return <SharedStepsView resource={model.sharedSteps} />;
  }
  if (model.view === "integrations") {
    return (
      <IntegrationsView
        cases={model.projectCases}
        onCreate={() => model.setDialog("integration")}
        onOpenCase={(testCase) => {
          model.setSelectedCaseId(testCase.id);
          model.setSelectedFolder(testCase.folderPath);
          model.setView("cases");
        }}
        onRun={(caseId) => model.openRunDialog({ caseIds: [caseId] })}
      />
    );
  }
  if (model.view === "api") return <ApiTestingView />;
  if (model.view === "suites") {
    return (
      <SuitesView
        suites={model.projectSuites}
        cases={model.projectCases}
        selected={model.selectedSuiteId}
        selectedDetail={model.selectedSuite}
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
      <ConfigView
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
  if (model.view === "runs") {
    return (
      <RunsView
        offline={model.connection === "demo"}
        runs={model.projectRuns}
        cases={model.projectCases}
        selectedRun={model.selectedRun}
        items={model.runItems}
        selectedItem={model.selectedRunItem}
        progress={model.executionProgress}
        onSelectRun={(id) => {
          model.setSelectedRunId(id);
          model.setSelectedRunItemId(null);
        }}
        onSelectItem={model.setSelectedRunItemId}
        onCreate={() => model.openRunDialog()}
        onStepStatus={model.setStepStatus}
        onStepActual={model.updateStepActualResult}
        onItemStatus={model.setItemStatus}
        onComplete={model.completeRun}
        canArchive={model.canArchiveRun}
        archivePending={model.archivePending}
        onArchive={model.archiveSelectedRun}
        onRestore={model.restoreSelectedRun}
        onDefectCreated={(defect) => {
          model.setData((current) => ({
            ...current,
            defects: [...current.defects, defect],
          }));
          model.notify(t("actions.defectCreated", { key: defect.key }));
        }}
      />
    );
  }
  if (model.view === "hooks") return <HooksView workspaceId={model.data.workspace.id} />;
  return (
    <ReportsView
      defects={model.reportDefects}
      runs={model.projectRuns}
      links={model.projectLinks}
      selectedDefectId={model.selectedDefectId}
      onSelectDefect={model.setSelectedDefectId}
      selectedDefectStatus={model.selectedDefectResource.status}
      onRetrySelectedDefect={model.selectedDefectResource.retry}
      onNew={() => model.setDialog("defect")}
      onOpenRun={(runId, runItemId) => {
        model.setSelectedDefectId(null);
        model.setSelectedRunId(runId);
        model.setSelectedRunItemId(runItemId);
        model.setView("runs");
      }}
    />
  );
}
