import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RunsView } from "../../runs/RunsView";
import { useImpactList } from "../../../impact/application/list/useImpactList";
import { RunImpactSummary } from "../../../impact/presentation/run/RunImpactSummary";
import { TessiqLoader } from "../../common/loading/TessiqLoader";
export function WorkspaceRunsStage({ model }: { model: WorkspaceModel }) {
  const { t, locale } = useTmsLocale();
  const impactScope = { workspaceId: model.data.workspace.id, projectId: model.project?.id ?? "" };
  const impactEnabled = model.connection === "connected" && Boolean(model.selectedRun)
    && model.data.meta.authorization.capabilities.includes("integration:read");
  const impact = useImpactList(impactScope, impactEnabled, locale === "ru", model.selectedRun?.id);
  if (model.runResourceError) return <div role="alert">
    <p>{locale === "ru" ? "Не удалось открыть выбранный прогон. Проверьте доступ и повторите загрузку." : "The selected run could not be opened. Check access and retry."}</p>
    <button type="button" onClick={model.retryRunResource}>{locale === "ru" ? "Повторить" : "Retry"}</button>
  </div>;
  const scopeLoading = model.connection === "connected" && Boolean(model.selectedRun || model.selectedRunId)
    && !model.runResourceReady;
  if (scopeLoading && !model.selectedRun) return <TessiqLoader pane label={t("common.loading")} testId="run-resource-loading" />;
  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {impactEnabled && <RunImpactSummary state={impact} scope={impactScope} ru={locale === "ru"} />}
      <div style={{ flex: 1, minHeight: 0 }}>
      <RunsView
        workspaceId={model.data.workspace.id}
        offline={model.connection === "demo"}
        runs={model.projectRuns}
        cases={model.projectCases}
        selectedRun={model.selectedRun}
        items={model.runItems}
        scopeLoading={scopeLoading}
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
        onSaveStepActual={model.setStepStatus}
        onItemStatus={model.setItemStatus}
        onComplete={model.completeRun}
        canExecute={model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:execute")}
        canStart={model.canStartRun && (!impactEnabled || (impact.ready && !impact.error && impact.items.every((item) => item.approved)))}
        startPending={model.startPending}
        startError={model.startError}
        onStart={model.startSelectedRun}
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
      </div>
    </div>
  );
}
