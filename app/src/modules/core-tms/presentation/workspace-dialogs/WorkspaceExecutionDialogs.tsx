import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { localizedLabel } from "../../localization/format/labels";
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
  const { locale, t } = useTmsLocale();
  const close = () => {
    model.closeResourceEditors();
    model.setDialog(null);
  };
  if (model.dialog === "environment") {
    return (
      <EnvironmentDialog
        projectId={model.project?.id ?? ""}
        environment={model.environmentEditor?.data}
        environmentEtag={model.environmentEditor?.etag}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(environment) => {
          model.setData((current) => ({
            ...current,
            environments: [...current.environments, environment],
          }));
          close();
          model.notify(t("actions.environmentCreated"));
        }}
        onUpdated={(environment, etag) => {
          model.acceptEnvironmentUpdate(environment, etag);
          close();
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
          model.setSelectedRunItemId(null);
          model.setRunPresetCaseIds([]);
          model.setRunPresetSuiteId("");
          model.setView("runs");
          close();
          model.notify(t("actions.runStarted", {
            type: localizedLabel(locale, run.type), count: run.itemCount,
          }));
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
        components={model.projectCases.map((testCase) => testCase.component)}
        offline={model.connection === "demo"}
        onClose={close}
        onCreated={(defect) => {
          model.setData((current) => ({
            ...current,
            defects: [...current.defects, defect],
          }));
          close();
          model.notify(t("actions.defectCreated", { key: defect.key }));
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
          model.notify(t("actions.dashboardCreated"));
        }}
      />
    );
  }
  return null;
}
