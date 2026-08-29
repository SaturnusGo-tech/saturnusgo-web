import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { CasesView } from "../cases/CasesView";
import { ConfigView } from "../config/ConfigView";
import { DashboardView } from "../dashboard/DashboardView";
import { HooksView } from "../hooks/HooksView";
import { IntegrationsView } from "../integrations/IntegrationsView";
import { ProjectOnboarding } from "../onboarding/ProjectOnboarding";
import { ReportsView } from "../reports/ReportsView";
import { RunsView } from "../runs/RunsView";
import { SuitesView } from "../suites/SuitesView";
import { WorkspaceLoadState } from "../workspace-state/WorkspaceLoadState";

export function WorkspaceStage({ model }: { model: WorkspaceModel }) {
  const { t } = useTmsLocale();
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
        onCreate={() => model.setDialog("dashboard")}
        onOpenRuns={() => model.setView("runs")}
      />
    );
  }
  if (model.view === "cases") {
    return (
      <CasesView
        query={model.query}
        onQuery={model.setQuery}
        groups={model.folderGroups}
        collapsed={model.collapsedFolders}
        onToggleFolder={(folderName) =>
          model.setCollapsedFolders((current) =>
            current.includes(folderName)
              ? current.filter((item) => item !== folderName)
              : [...current, folderName],
          )
        }
        selectedFolder={model.selectedFolder}
        onSelectFolder={model.selectFolder}
        selectedCaseId={model.selectedCase?.id ?? ""}
        onSelectCase={(id) => {
          model.setSelectedCaseId(id);
          model.setEditing(false);
        }}
        testCase={model.selectedCase}
        revision={model.selectedRevision}
        linkIds={model.selectedCaseDetail?.linkIds ?? []}
        onNew={model.openNewCase}
        onEdit={model.openEditCase}
        onClone={model.cloneCase}
        onArchive={model.toggleArchiveCase}
        onRunCase={() =>
          model.selectedCase &&
          model.openRunDialog({ caseIds: [model.selectedCase.id] })
        }
        activity={model.data.activity}
        filters={model.caseFilters}
        onFilters={model.setCaseFilters}
        onNewFolder={() => model.setDialog("folder")}
        onNewProject={model.openNewProject}
        onCollapseAll={() =>
          model.setCollapsedFolders(
            model.folderGroups.map(([folderName]) => folderName),
          )
        }
        onExpandAll={() => model.setCollapsedFolders([])}
      />
    );
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
  if (model.view === "hooks") return <HooksView />;
  return (
    <ReportsView
      defects={model.projectDefects}
      runs={model.projectRuns}
      onNew={() => model.setDialog("defect")}
    />
  );
}
