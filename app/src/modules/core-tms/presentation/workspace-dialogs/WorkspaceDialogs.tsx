import { ImportCasesDialog } from "../../test-cases/exchange/presentation/ImportCasesDialog";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { FolderDialog } from "../dialogs/folder/FolderDialog";
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
        onCreated={(createdProject) => {
          model.setData((current) => ({
            ...current,
            projects: [...current.projects, createdProject],
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
  if (model.dialog === "import-cases" && model.project) return <ImportCasesDialog project={model.project}
    workspaceId={model.data.workspace.id} folders={model.folders.items}
    initialFolderId={model.folders.items.find((folder) => folder.path === model.selectedFolder && !folder.archivedAt)?.id ?? null}
    onClose={close} onImported={async () => { model.folders.reload(); await model.loadProject(model.project!.id); }} />;
  if (model.dialog === "folder" && model.project) {
    return (
      <FolderDialog
        existing={model.folders.items.filter((folder) => !folder.archivedAt).map((folder) => folder.path)}
        selectedParent={model.selectedFolder}
        busy={model.folders.busy} error={model.folders.error}
        onClose={() => { if (!model.folders.busy) close(); }}
        onCreated={async (folderPath) => {
          const parts = folderPath.split("/").filter(Boolean); const name = parts.pop()!;
          const parentPath = `/${parts.join("/")}`;
          const parent = model.folders.items.find((folder) => folder.path === parentPath && !folder.archivedAt);
          const result = await model.folders.create(name, parent?.id ?? null);
          if (!result) return;
          model.selectFolder(result.path, result.id); model.setSelectedCaseId(""); close();
          model.notify(t("actions.folderCreated", { path: result.path }));
        }}
      />
    );
  }
  if (model.dialog === "suite") {
    return (
      <SuiteDialog
        projectId={model.project?.id ?? ""}
        projectName={model.project?.name ?? ""}
        folders={model.folders.items}
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
