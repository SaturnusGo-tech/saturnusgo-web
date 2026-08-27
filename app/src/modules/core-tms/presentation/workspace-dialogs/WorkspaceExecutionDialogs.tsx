import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { DashboardDialog } from "../dialogs/dashboard/DashboardDialog";
import { DefectDialog } from "../dialogs/defect/DefectDialog";
import { EnvironmentDialog } from "../dialogs/environment/EnvironmentDialog";
import { RunDialog } from "../dialogs/run/RunDialog";

export function WorkspaceExecutionDialogs({
  model,
}: {
  model: WorkspaceModel;
}) {
  const close = () => model.setDialog(null);
  if (model.dialog === "environment") {
    return (
      <EnvironmentDialog
        projectId={model.project?.id ?? ""}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(environment) => {
          model.setData((current) => ({
            ...current,
            environments: [...current.environments, environment],
          }));
          close();
          model.notify("Environment created");
        }}
      />
    );
  }
  if (model.dialog === "run" && model.project) {
    return (
      <RunDialog
        data={model.data}
        project={model.project}
        selectedSuiteId={model.runPresetSuiteId}
        presetCaseIds={model.runPresetCaseIds}
        offline={model.connection === "demo"}
        onClose={() => {
          model.setRunPresetCaseIds([]);
          model.setRunPresetSuiteId("");
          close();
        }}
        onCreated={(run) => {
          model.setData((current) => ({
            ...current,
            runs: [...current.runs, run],
          }));
          model.setSelectedRunId(run.id);
          model.setSelectedRunItemId(run.items[0]?.id ?? null);
          model.setRunPresetCaseIds([]);
          model.setRunPresetSuiteId("");
          model.setView("runs");
          close();
          model.notify(
            `${run.type} run started with ${run.items.length} ${run.items.length === 1 ? "case" : "cases"}`,
          );
        }}
      />
    );
  }
  if (model.dialog === "defect" && model.project) {
    return (
      <DefectDialog
        projectId={model.project.id}
        run={model.selectedRun}
        item={model.selectedRunItem}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(defect) => {
          model.setData((current) => ({
            ...current,
            defects: [...current.defects, defect],
          }));
          close();
          model.notify(`${defect.key} created and linked`);
        }}
      />
    );
  }
  if (model.dialog === "dashboard") {
    return (
      <DashboardDialog
        workspaceId={model.data.workspace.id}
        projectId={model.project?.id ?? null}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(dashboard) => {
          model.setData((current) => ({
            ...current,
            dashboards: [...current.dashboards, dashboard],
          }));
          close();
          model.notify("Dashboard created");
        }}
      />
    );
  }
  return null;
}
