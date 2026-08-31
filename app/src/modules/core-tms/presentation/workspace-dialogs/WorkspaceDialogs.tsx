import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { FolderDialog } from "../dialogs/folder/FolderDialog";
import { IntegrationDialog } from "../dialogs/integration/IntegrationDialog";
import { ProjectDialog } from "../dialogs/project/ProjectDialog";
import { SuiteDialog } from "../dialogs/suite/SuiteDialog";
import { WorkspaceExecutionDialogs } from "./WorkspaceExecutionDialogs";

export function WorkspaceDialogs({ model }: { model: WorkspaceModel }) {
  const { t } = useTmsLocale();
  const close = () => {
    model.closeResourceEditors();
    model.setDialog(null);
  };
  if (model.dialog === "project") {
    return (
      <ProjectDialog
        workspaceId={model.data.workspace.id}
        project={model.projectEditor?.data}
        projectEtag={model.projectEditor?.etag}
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
        onUpdated={(project, etag) => {
          model.acceptProjectUpdate(project, etag);
          close();
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
  if (model.dialog === "integration" && model.project) {
    return (
      <IntegrationDialog
        project={model.project}
        casesCount={model.projectCases.length}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(testCase) => {
          const { current: _current, linkIds: _linkIds, ...summary } = testCase;
          model.setData((current) => ({
            ...current,
            testCases: [...current.testCases, summary],
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
        suite={model.selectedSuiteDetail?.id === model.editingSuiteId
          ? model.selectedSuiteDetail
          : undefined}
        suiteEtag={model.selectedSuiteEtag}
        offline={model.connection === "demo"}
        onClose={close}
        onSaved={(suite, etag) => {
          const existing = model.data.suites.some((item) => item.id === suite.id);
          const { caseIds: _caseIds, filter: _filter, resolvedCaseCount: _resolved, ...summary } = suite;
          model.setData((current) => ({
            ...current,
            suites: current.suites.some((item) => item.id === suite.id)
              ? current.suites.map((item) =>
                  item.id === suite.id ? summary : item,
                )
              : [...current.suites, summary],
          }));
          model.setSelectedSuiteId(suite.id);
          model.setSelectedSuiteDetail(suite);
          model.setSelectedSuiteEtag(etag);
          model.setEditingSuiteId(null);
          close();
          model.notify(t(existing ? "actions.suiteUpdated" : "actions.suiteCreated"));
        }}
      />
    );
  }
  return <WorkspaceExecutionDialogs model={model} />;
}
