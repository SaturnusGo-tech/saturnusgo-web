import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { CaseDialog } from "../dialogs/case/CaseDialog";
import { FolderDialog } from "../dialogs/folder/FolderDialog";
import { IntegrationDialog } from "../dialogs/integration/IntegrationDialog";
import { ProjectDialog } from "../dialogs/project/ProjectDialog";
import { SuiteDialog } from "../dialogs/suite/SuiteDialog";
import { WorkspaceExecutionDialogs } from "./WorkspaceExecutionDialogs";

export function WorkspaceDialogs({ model }: { model: WorkspaceModel }) {
  const { t } = useTmsLocale();
  const close = () => model.setDialog(null);
  if (model.dialog === "project") {
    return (
      <ProjectDialog
        workspaceId={model.data.workspace.id}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(createdProject, environment) => {
          model.setData((current) => ({
            ...current,
            projects: [...current.projects, createdProject],
            environments: [...current.environments, environment],
          }));
          model.chooseProject(createdProject.id);
          model.setProjectId(createdProject.id);
          model.setSelectedCaseId("");
          model.setSelectedFolder("/Unsorted");
          model.setView("cases");
          close();
          model.notify(t("actions.projectCreated", { name: createdProject.name }));
        }}
      />
    );
  }
  if (model.dialog === "folder" && model.project) {
    return (
      <FolderDialog
        existing={model.folderGroups.map(([folderName]) => folderName)}
        selectedParent={model.selectedFolder}
        onClose={close}
        onCreated={(folderPath) => {
          model.setCustomFolders((current) => ({
            ...current,
            [model.project!.id]: Array.from(
              new Set([...(current[model.project!.id] ?? []), folderPath]),
            ),
          }));
          model.setSelectedFolder(folderPath);
          model.setSelectedCaseId("");
          model.setCollapsedFolders((current) =>
            current.filter((item) => item !== folderPath),
          );
          close();
          model.notify(t("actions.folderCreated", { path: folderPath }));
        }}
      />
    );
  }
  if (model.dialog === "case") {
    return (
      <CaseDialog
        value={model.caseDraft}
        onChange={model.setCaseDraft}
        folderPath={model.caseFolderPath}
        onFolderPath={model.setCaseFolderPath}
        folders={model.folderGroups.map(([folderName]) => folderName)}
        editing={model.editing}
        onClose={close}
        onSubmit={model.saveCase}
      />
    );
  }
  if (model.dialog === "integration" && model.project) {
    return (
      <IntegrationDialog
        project={model.project}
        casesCount={model.projectCases.length}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(testCase) => {
          model.setData((current) => ({
            ...current,
            testCases: [...current.testCases, testCase],
          }));
          model.setSelectedCaseId(testCase.id);
          model.setSelectedFolder(testCase.folderPath);
          close();
          model.notify(t("actions.integrationCreated", { key: testCase.key }));
        }}
      />
    );
  }
  if (model.dialog === "suite") {
    return (
      <SuiteDialog
        projectId={model.project?.id ?? ""}
        cases={model.projectCases}
        suite={model.data.suites.find(
          (item) => item.id === model.editingSuiteId,
        )}
        offline={model.connection === "demo"}
        onClose={close}
        onSaved={(suite) => {
          const existing = model.data.suites.some((item) => item.id === suite.id);
          model.setData((current) => ({
            ...current,
            suites: current.suites.some((item) => item.id === suite.id)
              ? current.suites.map((item) =>
                  item.id === suite.id ? suite : item,
                )
              : [...current.suites, suite],
          }));
          model.setSelectedSuiteId(suite.id);
          model.setEditingSuiteId(null);
          close();
          model.notify(t(existing ? "actions.suiteUpdated" : "actions.suiteCreated"));
        }}
      />
    );
  }
  return <WorkspaceExecutionDialogs model={model} />;
}
