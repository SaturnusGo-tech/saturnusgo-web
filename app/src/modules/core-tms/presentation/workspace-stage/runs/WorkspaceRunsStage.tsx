import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RunsView } from "../../runs/RunsView";
export function WorkspaceRunsStage({ model }: { model: WorkspaceModel }) {
  const { t, locale } = useTmsLocale();
  if (model.runResourceError) return <div role="alert">
    <p>{locale === "ru" ? "Не удалось открыть выбранный прогон. Проверьте доступ и повторите загрузку." : "The selected run could not be opened. Check access and retry."}</p>
    <button type="button" onClick={model.retryRunResource}>{locale === "ru" ? "Повторить" : "Retry"}</button>
  </div>;
  if (model.runResourceLoading && !model.selectedRun) return <p role="status">
    {locale === "ru" ? "Загружаем выбранный прогон…" : "Loading the selected run…"}</p>;
  return (
      <RunsView
        workspaceId={model.data.workspace.id}
        offline={model.connection === "demo"}
        runs={model.projectRuns}
        cases={model.projectCases}
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
        canArchive={model.canArchiveRun}
        archivePending={model.archivePending}
        onArchive={model.archiveSelectedRun}
        onRestore={model.restoreSelectedRun}
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
