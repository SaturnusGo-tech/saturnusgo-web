import { PortfoliosView } from "../../../portfolios/presentation/PortfoliosView";
import { usePortfolioRoute } from "../../../portfolios/navigation/usePortfolioRoute";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";

export function WorkspacePortfoliosStage({ model }: { model: WorkspaceModel }) {
  const navigation = usePortfolioRoute();
  return <PortfoliosView workspaceId={model.data.workspace.id} offline={model.connection !== "connected"}
    canManage={model.data.meta.authorization.capabilities.includes("project:manage")}
    route={navigation.route} onNavigate={navigation.navigate}
    onOpenCases={async (projectId) => {
      if (!await model.chooseProject(projectId)) return;
      model.setSelectedFolder(""); model.setSelectedCaseId(""); model.setView("cases");
    }}
    onProjectCreated={(project) => model.setData((current) => ({ ...current,
      projects: current.projects.some((item) => item.id === project.id) ? current.projects.map((item) => item.id === project.id ? project : item) : [...current.projects, project] }))}
    onProjectUpdated={model.acceptProjectUpdate} />;
}
