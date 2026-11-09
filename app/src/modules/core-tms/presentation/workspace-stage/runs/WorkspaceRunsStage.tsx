import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { canEditRunMetadata } from "../../../runs/edit/model/run-edit";
import { RunEditDialog } from "../../../runs/edit/presentation/RunEditDialog";
import { VerificationRunContext } from "../../../runs/verification/presentation/context/VerificationRunContext";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import { visitWorkspace } from "../../../state/navigation/browser/workspace-history";
import { useRunRepository } from "../../runs/repository/state/useRunRepository";
import { useRunExecutionNavigation } from "../../runs/navigation/state/useRunExecutionNavigation";
import { useEffect, useState } from "react";
import { RunRepositoryBrowser } from "../../runs/repository/RunRepositoryBrowser";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RunsView } from "../../runs/RunsView";
import { useRunImpact } from "../../../impact/application/run/useRunImpact";
import { RunImpactSummary } from "../../../impact/presentation/run/RunImpactSummary";
import runLayout from "./workspace-runs-stage.module.css";

export function WorkspaceRunsStage({ model, fixedRun = false, onCloseLockedChange }: {
  model: WorkspaceModel;
  fixedRun?: boolean;
  onCloseLockedChange?(locked: boolean): void;
}) {
  const [editingRun, setEditingRun] = useState<TestRunSummary | null>(null);
  const [executionDirty, setExecutionDirty] = useState(false);
  const { t, locale } = useTmsLocale();
  const repository = useRunRepository(model, locale === "ru", fixedRun);
  const execution = useRunExecutionNavigation(model, repository, executionDirty);
  const impactScope = { workspaceId: model.data.workspace.id, projectId: model.projectId };
  const impactEligible = model.connection === "connected" && Boolean(model.selectedRun)
    && model.data.meta.authorization.capabilities.includes("integration:read");
  const { enabled: impactEnabled, impact, startBlocked } = useRunImpact(impactScope, impactEligible, locale === "ru", model.selectedRun);
  const closeLocked = executionDirty || execution.pending || repository.browser.busy || repository.assignments.busy || Boolean(editingRun);
  useEffect(() => { onCloseLockedChange?.(closeLocked); }, [closeLocked, onCloseLockedChange]);
  if (model.runResourceError) return <div className={runLayout.error} role="alert">
    <p>{locale === "ru" ? "Не удалось открыть выбранный прогон. Проверьте доступ и повторите загрузку." : "The selected run could not be opened. Check access and retry."}</p>
    <button type="button" onClick={model.retryRunResource}>{locale === "ru" ? "Повторить" : "Retry"}</button>
  </div>;
  const scopeLoading = model.connection === "connected" && Boolean(model.selectedRun || model.selectedRunId)
    && !model.runResourceReady;
  const onEditRun = model.selectedRun && canEditRunMetadata(model.selectedRun) && model.connection === "connected"
    && !executionDirty && !execution.pending && model.data.meta.authorization.capabilities.includes("run:manage")
    ? () => setEditingRun(model.selectedRun) : undefined;
  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {impactEnabled && <RunImpactSummary state={impact} scope={impactScope} ru={locale === "ru"} />}
      <div className={runLayout.pane}>
      <RunsView
        embedded={fixedRun}
        onCreate={!fixedRun && model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:manage") ? () => model.openRunDialog() : undefined}
        verificationContext={<VerificationRunContext run={model.selectedRun} item={execution.selectedItem}
          connected={model.connection === "connected"} onOpenDefect={model.openDefect}
          onOpenCaseActivity={(caseId) => visitWorkspace(buildCaseDeepLink(window.location.href, {
            workspaceId: model.data.workspace.id, projectId: model.projectId, caseId,
          }, { activity: true }))} />}
        navigation={<RunRepositoryBrowser model={model} repository={repository} onSelectItem={execution.select} onEditRun={onEditRun} draftDirty={executionDirty} lifecycleBlocked={executionDirty || execution.pending} startBlocked={startBlocked} fixedRun={fixedRun} />}
        onDirtyChange={setExecutionDirty}
        workspaceId={model.data.workspace.id}
        offline={model.connection === "demo"}
        cases={model.projectCases}
        selectedRun={model.selectedRun}
        items={execution.entries.map(row => row.item)}
        scopeLoading={scopeLoading || Boolean(model.selectedRun && !execution.ready)}
        openingItem={execution.openingItem}
        itemLoadError={model.runItemResourceError}
        onRetryItem={execution.retryItem}
        selectedItem={execution.selectedItem}
        onSelectItem={execution.select}
        onStepStatus={execution.step}
        onStepActual={model.updateStepActualResult}
        onSaveStepActual={execution.step}
        onItemStatus={execution.mark} onUnblock={execution.unblock}
        executionPending={execution.pending || repository.browser.busy || scopeLoading || !execution.ready}
        emptyFiltered={execution.ready && repository.rows.length > 0}
        canExecute={execution.detailReady && model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:execute")}
        startPending={model.startPending}
        startError={model.startError}
        onStart={model.startSelectedRun}
        canArchive={model.canArchiveRun}
        archivePending={model.archivePending}
        onArchive={model.archiveSelectedRun}
        onDefectCreated={(defect) => {
          model.setData((current) => ({
            ...current,
            defects: [...current.defects, defect],
          }));
          model.notify(t("actions.defectCreated", { key: defect.key }));
        }}
      />
      </div>
      {editingRun && <RunEditDialog key={editingRun.id} run={editingRun} workspaceId={model.data.workspace.id}
        onClose={() => setEditingRun(null)} onSaved={run => {
          model.setData(current => ({ ...current, runs: current.runs.map(item => item.id === run.id ? run : item) }));
          setEditingRun(null); repository.browser.refresh(); model.retryRunResource();
          model.notify(locale === "ru" ? "Настройки прогона сохранены" : "Run settings saved");
        }} />}
    </div>
  );
}
