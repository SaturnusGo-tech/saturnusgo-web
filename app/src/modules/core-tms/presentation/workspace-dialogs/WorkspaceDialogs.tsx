import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { ProjectDialog } from "../dialogs/project/ProjectDialog";
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
  return <WorkspaceExecutionDialogs model={model} />;
}
