import type { DashboardViewProps } from "../../dashboard-view";
import type { DashboardModel } from "../../customize/model/useDashboardModel";
import { DashboardDrillInspector } from "../../inspector/DashboardDrillInspector";
import { WorkbenchDrillInspector } from "../../workbench/inspector/WorkbenchDrillInspector";
export function DashboardDetail({ model, onBack, ...props }: DashboardViewProps & { model: DashboardModel; onBack: () => void }) {
  const { analytics, workbench, query } = model; const drill = analytics.drill;
  const projectId = drill.origin?.projectId ?? props.projectId;
  const scopeLabel = props.data.projects.find(project => project.id === projectId)?.name ?? "";
  if (workbench.drill) return <WorkbenchDrillInspector key={workbench.drill.kind} model={workbench} data={props.data} scopeLabel={scopeLabel}
    onBack={onBack} onOpenRow={props.onOpenRow} onOpenSection={defects => props.onOpenEntity(defects ? "defect" : "run", {
      id: "workbench", label: "", filter: defects ? { entity: "defect", basis: "current" } : { entity: "run", basis: "active" },
    })} />;
  if (!drill.origin || !drill.selected) return null;
  return <DashboardDrillInspector key={drill.selected.id} {...props} query={query} origin={drill.origin} selected={drill.selected}
    page={drill.page} loading={drill.loading} error={drill.error} scopeLabel={scopeLabel}
    onSelectDrill={analytics.selectRelatedDrill} onSelectComponent={analytics.openDrill}
    onClose={onBack} onRetry={analytics.retryDrill} onLoadMore={analytics.loadMore} />;
}
