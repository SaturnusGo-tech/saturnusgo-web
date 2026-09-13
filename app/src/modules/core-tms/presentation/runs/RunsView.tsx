import { Ban, Bug, Check, CheckCircle2, ChevronLeft, ChevronRight, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Defect, ExecutionStatus, RunItem, RunItemSummary, TestCaseSummary, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { canEditRunAttempt } from "../../application/runs/execution/attempt-editing";
import { ScenarioMarkdown } from "../cases/inspector/steps/markdown/ScenarioMarkdown";
import { StepActualEditor } from "./actual/StepActualEditor";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { FormError } from "../common/error/FormError";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { statusIcon } from "../status/executionStatus";
import { InlineDefectComposer } from "./defect/InlineDefectComposer";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";
import { RunScopeEmpty } from "./empty/RunScopeEmpty";
import { runScopeState } from "./state/run-view-state";
import { RunExecutionHeader } from "./header/RunExecutionHeader";
import { useRunKeyboardShortcuts } from "./execution/useRunKeyboardShortcuts";
import { EstimateBadge, PriorityBadge, TypeBadge } from "../cases/list/CaseBadges";
import styles from "../../tms.module.css";
import runStyles from "./runs.module.css";
type RunsViewProps = {
  executionPending?: boolean; emptyFiltered?: boolean;
  verificationContext?: ReactNode;
  onCreate?: () => void;
  navigation: ReactNode; onDirtyChange?: (dirty: boolean) => void;
  workspaceId: string;
  offline: boolean;
  cases: TestCaseSummary[];
  selectedRun: TestRunSummary | null;
  items: RunItemSummary[];
  scopeLoading: boolean;
  selectedItem: RunItem | null;
  onSelectItem: (id: string) => void;
  onStepStatus: (stepId: string, status: ExecutionStatus) => void;
  onStepActual: (stepId: string, value: string) => void;
  onSaveStepActual: (stepId: string, status: ExecutionStatus, value: string) => Promise<boolean>;
  onItemStatus: (status: ExecutionStatus) => void;
  canExecute: boolean; startPending: boolean; startError: string; onStart: () => void;
  canArchive: boolean;
  archivePending: boolean;
  onArchive: (run: TestRunSummary) => void;
  onDefectCreated: (defect: Defect) => void;
};
export function RunsView({ executionPending = false, emptyFiltered = false, navigation, verificationContext, onCreate, onDirtyChange, workspaceId, offline, cases, selectedRun, items, scopeLoading, selectedItem, onSelectItem, onStepStatus, onStepActual, onSaveStepActual, onItemStatus, canExecute, startPending, startError, onStart, canArchive, archivePending, onArchive, onDefectCreated }: RunsViewProps) {
  const { locale, t } = useTmsLocale();
  const [reporting, setReporting] = useState(false);
  const [dirtySteps, setDirtySteps] = useState<string[]>([]);
  useEffect(() => { onDirtyChange?.(dirtySteps.length > 0); return () => onDirtyChange?.(false); }, [dirtySteps.length, onDirtyChange]);
  useEffect(() => {
    setReporting(false); setDirtySteps([]);
  }, [selectedItem?.id, selectedRun?.id]);
  const runWritable = Boolean(selectedRun && !selectedRun.archivedAt && selectedRun.status === "active");
  const editScope = JSON.stringify([selectedRun?.id, selectedItem?.id, selectedItem?.activeAttemptNo]);
  const currentEditScope = useRef(editScope); currentEditScope.current = editScope;
  const attemptWritable = canExecute && !selectedItem?.archivedAt && canEditRunAttempt(selectedRun, selectedItem);
  useRunKeyboardShortcuts({
    items, selectedItem, selectedRun, runWritable: attemptWritable && !executionPending && dirtySteps.length === 0, navigationBlocked: executionPending || dirtySteps.length > 0, onItemStatus, onSelectItem,
    setReporting,
  });
  const runNavigator = navigation;
  if (selectedRun && !selectedItem && runScopeState(scopeLoading, items.length) === "empty") return <div className={runStyles.shell} data-testid="runs-view">{runNavigator}<div className={runStyles.emptyPane}><RunScopeEmpty filtered={emptyFiltered} /></div></div>;
  if (selectedRun && !selectedItem) return <div className={runStyles.shell} data-testid="runs-view">{runNavigator}<div className={runStyles.emptyPane}><TessiqLoader pane label={t("common.loading")} testId="run-item-loading" /></div></div>;
  if (!selectedRun || !selectedItem) return <div className={runStyles.shell} data-testid="runs-view">{navigation}<div className={runStyles.emptyPane}><RunScopeEmpty noRun={!selectedRun} onCreate={onCreate} filtered={emptyFiltered} /></div></div>;
  const attempt = selectedItem.attempts.find((item) => item.attemptNo === selectedItem.activeAttemptNo) ?? selectedItem.attempts[0];
  const executionEntries = executableSteps(selectedItem.snapshot, locale);
  const failed = selectedItem.status === "failed" || attempt.stepResults.some((result) => result.status === "failed");
  const canPass = executionEntries.filter((step) => step.required).every((step) => attempt.stepResults.find((result) => result.stepId === step.id)?.status === "passed");
  const failedStep = executionEntries.find((step) => attempt.stepResults.find((result) => result.stepId === step.id)?.status === "failed") ?? executionEntries[0];
  const attachmentIds = Array.from(new Set([
    ...attempt.attachmentIds,
    ...attempt.stepResults.flatMap((result) => result.attachmentIds),
  ]));
  const currentIndex = items.findIndex((item) => item.id === selectedItem.id);
  return <div className={runStyles.shell} data-testid="runs-view">
    {runNavigator}
    <section key={`${selectedRun.id}-${selectedItem.id}`} className={`${runStyles.detail} ${runStyles.detailTransition} ${archivePending ? runStyles.detailArchiving : ""}`}>
      <RunExecutionHeader run={selectedRun} item={selectedItem} itemIndex={currentIndex} itemCount={items.length} canArchive={canArchive && !selectedRun.batchId} archivePending={archivePending} onArchive={onArchive} canStart={false} startPending={startPending} onStart={onStart} />
      {startError && <FormError message={startError} />}
      <div className={runStyles.detailContent}>
        <div className={runStyles.overviewLayout}>
          <div className={runStyles.primaryColumn}>
            {verificationContext}
            <section className={runStyles.contentSection}>
              <header><h2>{locale === "ru" ? "Описание" : "Description"}</h2></header>
              <p>{selectedItem.snapshot.description || (locale === "ru" ? "Описание не указано." : "No description.")}</p>
            </section>
            <section className={runStyles.contentSection}>
              <header><h2>{t("runs.preconditions")}</h2></header>
              <p>{selectedItem.snapshot.preconditions || (locale === "ru" ? "Предусловия не указаны." : "No preconditions.")}</p>
            </section>
            <section className={`${runStyles.contentSection} ${runStyles.scenarioSection}`}>
              <header><h2>{locale === "ru" ? "Сценарий" : "Scenario"}</h2><span>{executionEntries.length}</span></header>
              <div className={runStyles.steps} role="table" aria-label={selectedItem.snapshot.title}>
                {executionEntries.map((step, index) => {
                  const result = attempt.stepResults.find((item) => item.stepId === step.id);
                  const status = result?.status ?? "not_run";
                  return <article className={`${runStyles.step} ${runStyles[`step_${status}`]}`} key={step.id} role="row" aria-rowindex={index + 1}>
                    <div className={runStyles.stepTop}>
                      <span className={runStyles.stepNumber} role="cell">{step.order}</span>
                      <div className={runStyles.stepAction} role="cell"><ScenarioMarkdown value={step.action} label={locale === "ru" ? "Действие" : "Action"} /></div>
                      <span className={`${runStyles.executionBadge} ${runStyles[`execution_${status}`]}`}>{statusIcon[status]}{localizedLabel(locale, status)}</span>
                    </div>
                    <div className={runStyles.stepExpected} role="cell"><small>{t("runs.expected")}</small><ScenarioMarkdown value={step.expectedResult || "—"} label={t("runs.expected")} /></div>
                    <div className={runStyles.stepActual} role="cell"><small>{t("runs.actual")}</small>{["passed", "failed", "blocked"].includes(status) && attemptWritable ? <StepActualEditor key={`${selectedItem.id}:${attempt.attemptNo}:${step.id}`} order={step.order} value={result?.actualResult ?? ""} onChange={(value) => onStepActual(step.id, value)} onSave={(value) => onSaveStepActual(step.id, status, value)} onDirtyChange={(dirty) => { if (currentEditScope.current === editScope) setDirtySteps((current) => dirty ? Array.from(new Set([...current, step.id])) : current.filter((id) => id !== step.id)); }} /> : <span>{result?.actualResult || "—"}</span>}</div>
                    {attemptWritable && <div className={runStyles.stepActions} role="cell"><button aria-label={`${t("runs.passStep")} ${step.order}`} title={t("runs.passStep")} disabled={executionPending || dirtySteps.length > 0} className={status === "passed" ? runStyles.actionPassActive : ""} onClick={() => onStepStatus(step.id, "passed")}><Check size={15} /></button><button aria-label={`${t("runs.failStep")} ${step.order}`} title={t("runs.failStep")} disabled={executionPending || dirtySteps.length > 0} className={status === "failed" ? runStyles.actionFailActive : ""} onClick={() => onStepStatus(step.id, "failed")}><X size={15} /></button><button aria-label={`${t("runs.blockStep")} ${step.order}`} title={t("runs.blockStep")} disabled={executionPending || dirtySteps.length > 0} className={status === "blocked" ? runStyles.actionBlockActive : ""} onClick={() => onStepStatus(step.id, "blocked")}><Ban size={14} /></button></div>}
                  </article>;
                })}
              </div>
            </section>
          </div>
          <aside className={runStyles.sideRail}>
            <section className={runStyles.railSection}>
              <header><h2>{locale === "ru" ? "Свойства" : "Properties"}</h2></header>
              <div className={runStyles.propertyList}>
                <div><span>{t("runs.status")}</span><span className={`${runStyles.executionBadge} ${runStyles[`execution_${selectedItem.status}`]}`}>{statusIcon[selectedItem.status]}{localizedLabel(locale, selectedItem.status)}</span></div>
                <div><span>{locale === "ru" ? "Приоритет" : "Priority"}</span><PriorityBadge locale={locale} priority={selectedItem.preview?.priority ?? selectedItem.snapshot.priority} /></div>
                <div><span>{locale === "ru" ? "Тип" : "Type"}</span><TypeBadge locale={locale} type={selectedItem.snapshot.type} /></div>
                <div><span>{t("runs.estimate")}</span><EstimateBadge locale={locale} minutes={selectedItem.snapshot.estimatedMinutes} /></div>
              </div>
            </section>
            <section className={runStyles.railSection}>
              <header><h2>{locale === "ru" ? "Контекст рана" : "Run context"}</h2></header>
              <dl className={runStyles.runFacts}>
                <div><dt>{t("runs.environment")}</dt><dd>{selectedRun.environment.name || "-"}</dd></div>
                <div><dt>{t("runs.build")}</dt><dd>{selectedRun.build || "-"}</dd></div>
                <div><dt>{locale === "ru" ? "Прогресс" : "Progress"}</dt><dd>{selectedRun.progress.executed} / {selectedRun.itemCount} · {selectedRun.progress.percent}%</dd></div>
              </dl>
            </section>
          </aside>
        </div>
        {attachmentIds.length > 0 && <section className={runStyles.evidence}><strong>{t("runs.evidence")}</strong><div className={`${styles.attachmentGrid} ${runStyles.evidenceGrid}`}>{attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}</div></section>}
        {runWritable && reporting && failed && failedStep && <InlineDefectComposer key={`${selectedRun.id}-${selectedItem.id}-${failedStep.id}`} workspaceId={workspaceId} projectId={selectedRun.projectId} run={selectedRun} item={selectedItem} step={failedStep} components={cases.map((testCase) => testCase.component)} offline={offline} onClose={() => setReporting(false)} onCreated={onDefectCreated} />}
      </div>
    </section>
    {runWritable && <footer className={runStyles.footer} data-run-execution-footer>
      <div className={runStyles.pager}><button className={styles.textButton} aria-label={t("runs.previous")} disabled={executionPending || dirtySteps.length > 0 || currentIndex <= 0} onClick={() => onSelectItem(items[currentIndex - 1]?.id)}><ChevronLeft size={16} /><span className={runStyles.pagerLabel}>{locale === "ru" ? "Предыдущий" : "Previous"}</span></button><button className={styles.textButton} aria-label={t("runs.next")} disabled={executionPending || dirtySteps.length > 0 || currentIndex < 0 || currentIndex >= items.length - 1} onClick={() => onSelectItem(items[currentIndex + 1]?.id)}><span className={runStyles.pagerLabel}>{locale === "ru" ? "Следующий" : "Next"}</span><ChevronRight size={16} /></button></div>
      <div className={runStyles.actions}>{selectedRun.status === "active" && <>{attemptWritable && <><button className={`${styles.secondaryButton} ${runStyles.compactAction}`} aria-label={t("runs.block")} title={t("runs.block")} disabled={executionPending || dirtySteps.length > 0} onClick={() => onItemStatus("blocked")}><Ban size={16} /><span className={runStyles.compactActionLabel}>{t("runs.block")}</span></button><button className={`${styles.dangerButton} ${runStyles.compactAction}`} aria-label={t("runs.fail")} title={t("runs.fail")} disabled={executionPending || dirtySteps.length > 0} onClick={() => onItemStatus("failed")} data-testid="fail-case"><XCircle size={16} /><span className={runStyles.compactActionLabel}>{t("runs.fail")}</span></button><button className={`${styles.successButton} ${runStyles.compactAction}`} aria-label={t("runs.pass")} onClick={() => onItemStatus("passed")} data-testid="pass-case" disabled={executionPending || !canPass || dirtySteps.length > 0} title={!canPass ? t("runs.passRequiredFirst") : t("runs.pass")}><CheckCircle2 size={16} /><span className={runStyles.compactActionLabel}>{t("runs.pass")}</span></button></>}{failed && failedStep && <button className={`${styles.reportButton} ${runStyles.wideAction}`} type="button" aria-label={t("runs.reportBug")} title={t("runs.reportBug")} onClick={() => setReporting(true)} data-testid="report-defect" disabled={executionPending || dirtySteps.length > 0}><Bug size={16} /><span className={runStyles.mobileActionLabel}>{t("runs.reportBug")}</span></button>}</>}</div>

    </footer>}
  </div>;
}
