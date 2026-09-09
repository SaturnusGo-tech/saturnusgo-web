import { WorkspaceCasesStage } from "../cases/WorkspaceCasesStage";
import { PortfoliosView } from "../../../portfolios/presentation/PortfoliosView";
import { usePortfolioRoute } from "../../../portfolios/navigation/usePortfolioRoute";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";

export function WorkspacePortfoliosStage({ model }: { model: WorkspaceModel }) {
  const navigation = usePortfolioRoute();
  return <PortfoliosView key={model.data.workspace.id} workspaceId={model.data.workspace.id} offline={model.connection !== "connected"}
    canReadAttachments={model.data.meta.authorization.capabilities.includes("attachment:read")}
    canManageAttachments={model.data.meta.authorization.capabilities.includes("attachment:manage")}
    canManage={model.data.meta.authorization.capabilities.includes("project:manage")}
    route={navigation.route} onNavigate={navigation.navigate}
    projectCases={navigation.route.kind === "project" && model.project?.id === navigation.route.id ? <WorkspaceCasesStage model={model} /> : null}
    onActivateProject={async (projectId) => {
      if (model.project?.id === projectId) return true;
      return model.chooseProject(projectId);
    }}
    onProjectCreated={(project) => model.setData((current) => ({ ...current,
      projects: current.projects.some((item) => item.id === project.id) ? current.projects.map((item) => item.id === project.id ? project : item) : [...current.projects, project] }))}
    onProjectUpdated={model.acceptProjectUpdate} />;
}
