import { Ban, Bug, Check, CheckCircle2, ChevronLeft, ChevronRight, Paperclip, Play, PlayCircle, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Defect, ExecutionStatus, RunItem, RunItemSummary, TestCaseSummary, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { uploadEvidence } from "../../application/evidence/uploadEvidence";
import { useAttachmentClient } from "../../attachments/presentation/context/AttachmentClientProvider";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { FormError } from "../common/error/FormError";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { statusIcon } from "../status/executionStatus";
import { InlineDefectComposer } from "./defect/InlineDefectComposer";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";
import { RunNavigator, type RunListMode } from "./navigator/RunNavigator";
import { RunExecutionHeader } from "./header/RunExecutionHeader";
import { useRunKeyboardShortcuts } from "./execution/useRunKeyboardShortcuts";
import { EstimateBadge, PriorityBadge, TypeBadge } from "../cases/list/CaseBadges";
import styles from "../../tms.module.css";
import runStyles from "./runs.module.css";
type RunsViewProps = {
  offline: boolean;
  runs: TestRunSummary[];
  cases: TestCaseSummary[];
  selectedRun: TestRunSummary | null;
  items: RunItemSummary[];
  selectedItem: RunItem | null;
  progress: number;
  onSelectRun: (id: string) => void;
  onSelectItem: (id: string) => void;
  onCreate: () => void;
  onStepStatus: (stepId: string, status: ExecutionStatus) => void;
  onStepActual: (stepId: string, value: string) => void;
  onItemStatus: (status: ExecutionStatus) => void;
  onComplete: () => void;
  canArchive: boolean;
  archivePending: boolean;
  onArchive: (run: TestRunSummary) => void;
  onRestore: (run: TestRunSummary) => void;
  onDefectCreated: (defect: Defect) => void;
};

export function RunsView({ offline, runs, cases, selectedRun, items, selectedItem, progress, onSelectRun, onSelectItem, onCreate, onStepStatus, onStepActual, onItemStatus, onComplete, canArchive, archivePending, onArchive, onRestore, onDefectCreated }: RunsViewProps) {
  const { locale, t } = useTmsLocale();
  const attachments = useAttachmentClient();
  const [listMode, setListMode] = useState<RunListMode>("active");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [evidenceError, setEvidenceError] = useState("");
  const [reporting, setReporting] = useState(false);
  const evidenceOperation = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    setReporting(false);
    setEvidence([]);
    setEvidenceError("");
    evidenceOperation.current = null;
  }, [selectedItem?.id, selectedRun?.id]);
  useEffect(() => {
    if (selectedRun) setListMode(selectedRun.archivedAt ? "archived" : "active");
  }, [selectedRun?.archivedAt, selectedRun?.id]);
  const runWritable = Boolean(selectedRun && !selectedRun.archivedAt && selectedRun.status === "active");
  useRunKeyboardShortcuts({
    items, selectedItem, selectedRun, runWritable, onItemStatus, onSelectItem,
    setReporting,
  });
  async function addEvidence(files: File[]) {
    if (!selectedRun || !selectedItem || files.length === 0) return;
    setEvidenceError("");
    try {
      if (offline) throw new Error("Evidence upload requires the TMS API.");
      const attempt = selectedItem.attempts.find((item) => item.attemptNo === selectedItem.activeAttemptNo)
        ?? selectedItem.attempts[0];
      const signature = files.map((file) => `${file.name}:${file.size}:${file.lastModified}`).join("|");
      if (evidenceOperation.current?.signature !== signature) {
        evidenceOperation.current = { signature, key: crypto.randomUUID() };
      }
      const uploaded = await uploadEvidence({
        client: attachments,
        projectId: selectedRun.projectId,
        owner: {
          kind: "run_attempt",
          runId: selectedRun.id,
          runItemId: selectedItem.id,
          attemptNo: attempt.attemptNo,
        },
        files,
        operationKeyPrefix: evidenceOperation.current.key,
      });
      setEvidence((current) => [...current, ...uploaded.map((item) => item.id)]);
      evidenceOperation.current = null;
    } catch {
      setEvidenceError(t("runs.evidenceUploadError"));
    }
  }
  const selectedIsVisible = Boolean(selectedRun && (listMode === "archived" ? selectedRun.archivedAt : !selectedRun.archivedAt));
  function changeListMode(mode: RunListMode) {
    setListMode(mode);
    const next = runs.find((run) => mode === "archived" ? Boolean(run.archivedAt) : !run.archivedAt);
    if (next && next.id !== selectedRun?.id) onSelectRun(next.id);
  }
  const runNavigator = <RunNavigator
    runs={runs} cases={cases} selectedRun={selectedIsVisible ? selectedRun : null}
    items={selectedIsVisible ? items : []} selectedItemId={selectedIsVisible ? selectedItem?.id ?? null : null}
    mode={listMode} onModeChange={changeListMode}
    onSelectRun={onSelectRun} onSelectItem={onSelectItem} onCreate={onCreate}
    archivePending={archivePending} onRestore={canArchive ? onRestore : undefined}
  />;
  if (selectedRun && selectedIsVisible && !selectedItem) return <div className={runStyles.shell} data-testid="runs-view">{runNavigator}<div className={runStyles.emptyPane}><TessiqLoader pane label={t("common.loading")} testId="run-item-loading" /></div></div>;
  if (!selectedRun || !selectedItem || !selectedIsVisible) return <div className={runStyles.shell} data-testid="runs-view">{runNavigator}<div className={runStyles.emptyPane}><EmptyState icon={<PlayCircle size={36} />} title={listMode === "archived" ? t("runs.noArchived") : t("runs.noActive")} text={listMode === "archived" ? t("runs.noArchivedHint") : t("runs.noActiveHint")} action={listMode === "active" ? <button className={styles.primaryButton} onClick={onCreate} data-testid="new-run"><Play size={16} /> {t("runs.start")}</button> : undefined} /></div></div>;
  const attempt = selectedItem.attempts.find((item) => item.attemptNo === selectedItem.activeAttemptNo) ?? selectedItem.attempts[0];
  const executionEntries = executableSteps(selectedItem.snapshot, locale);
  const failed = selectedItem.status === "failed" || attempt.stepResults.some((result) => result.status === "failed");
  const canPass = executionEntries.filter((step) => step.required).every((step) => attempt.stepResults.find((result) => result.stepId === step.id)?.status === "passed");
  const failedStep = executionEntries.find((step) => attempt.stepResults.find((result) => result.stepId === step.id)?.status === "failed") ?? executionEntries[0];
  const attachmentIds = Array.from(new Set([
    ...attempt.attachmentIds,
    ...attempt.stepResults.flatMap((result) => result.attachmentIds),
    ...evidence,
  ]));
  const canComplete = runWritable && items.every((item) => ["passed", "failed", "blocked", "skipped"].includes(item.status));
  const currentIndex = items.findIndex((item) => item.id === selectedItem.id);
  return <div className={runStyles.shell} data-testid="runs-view">
    {runNavigator}
    <section key={`${selectedRun.id}-${selectedItem.id}`} className={`${runStyles.detail} ${runStyles.detailTransition} ${archivePending ? runStyles.detailArchiving : ""}`}>
      <RunExecutionHeader run={selectedRun} item={selectedItem} itemIndex={currentIndex} itemCount={items.length} canArchive={canArchive} archivePending={archivePending} onArchive={onArchive} />
      <div className={runStyles.detailContent}>
        <div className={runStyles.overviewLayout}>
          <div className={runStyles.primaryColumn}>
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
                      <div className={runStyles.stepAction} role="cell"><span>{step.action}</span></div>
                      <span className={`${runStyles.executionBadge} ${runStyles[`execution_${status}`]}`}>{statusIcon[status]}{localizedLabel(locale, status)}</span>
                    </div>
                    <div className={runStyles.stepExpected} role="cell"><small>{t("runs.expected")}</small><span>{step.expectedResult || "—"}</span></div>
                    <div className={runStyles.stepActual} role="cell"><small>{t("runs.actual")}</small>{status === "failed" && runWritable ? <textarea aria-label={`${t("runs.actual")}: ${step.order}`} value={result?.actualResult ?? ""} onChange={(event) => onStepActual(step.id, event.target.value)} placeholder={t("runs.actualPlaceholder")} /> : <span>{status === "passed" ? result?.actualResult || step.expectedResult : result?.actualResult || "—"}</span>}</div>
                    {runWritable && <div className={runStyles.stepActions} role="cell"><button aria-label={`${t("runs.passStep")} ${step.order}`} title={t("runs.passStep")} className={status === "passed" ? runStyles.actionPassActive : ""} onClick={() => onStepStatus(step.id, "passed")}><Check size={15} /></button><button aria-label={`${t("runs.failStep")} ${step.order}`} title={t("runs.failStep")} className={status === "failed" ? runStyles.actionFailActive : ""} onClick={() => onStepStatus(step.id, "failed")}><X size={15} /></button><button aria-label={`${t("runs.blockStep")} ${step.order}`} title={t("runs.blockStep")} className={status === "blocked" ? runStyles.actionBlockActive : ""} onClick={() => onStepStatus(step.id, "blocked")}><Ban size={14} /></button></div>}
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
                <div><span>{locale === "ru" ? "Приоритет" : "Priority"}</span><PriorityBadge locale={locale} priority={selectedItem.snapshot.priority} /></div>
                <div><span>{locale === "ru" ? "Тип" : "Type"}</span><TypeBadge locale={locale} type={selectedItem.snapshot.type} /></div>
                <div><span>{t("runs.estimate")}</span><EstimateBadge locale={locale} minutes={selectedItem.snapshot.estimatedMinutes} /></div>
              </div>
            </section>
            <section className={runStyles.railSection}>
              <header><h2>{locale === "ru" ? "Контекст рана" : "Run context"}</h2></header>
              <dl className={runStyles.runFacts}>
                <div><dt>{t("runs.environment")}</dt><dd>{selectedRun.environment.name}</dd></div>
                <div><dt>{t("runs.build")}</dt><dd>{selectedRun.build}</dd></div>
                <div><dt>{locale === "ru" ? "Прогресс" : "Progress"}</dt><dd>{selectedRun.progress.executed} / {selectedRun.itemCount} · {selectedRun.progress.percent}%</dd></div>
              </dl>
            </section>
          </aside>
        </div>
        {attachmentIds.length > 0 && <section className={runStyles.evidence}><strong>{t("runs.evidence")}</strong><div className={`${styles.attachmentGrid} ${runStyles.evidenceGrid}`}>{attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}</div></section>}
        {runWritable && reporting && failed && failedStep && <InlineDefectComposer key={`${selectedRun.id}-${selectedItem.id}-${failedStep.id}`} projectId={selectedRun.projectId} run={selectedRun} item={selectedItem} step={failedStep} components={cases.map((testCase) => testCase.component)} offline={offline} onClose={() => setReporting(false)} onCreated={onDefectCreated} />}
      </div>
    </section>
    {runWritable && <footer className={runStyles.footer}>
      <div className={runStyles.pager}><button className={styles.textButton} aria-label={t("runs.previous")} disabled={currentIndex <= 0} onClick={() => onSelectItem(items[currentIndex - 1]?.id)}><ChevronLeft size={16} /><span className={runStyles.pagerLabel}>{t("runs.previous")}</span></button><button className={styles.textButton} aria-label={t("runs.next")} disabled={currentIndex >= items.length - 1} onClick={() => onSelectItem(items[currentIndex + 1]?.id)}><span className={runStyles.pagerLabel}>{t("runs.next")}</span><ChevronRight size={16} /></button></div>
      <div className={runStyles.actions}>{selectedRun.status === "active" && <><button className={`${styles.secondaryButton} ${runStyles.compactAction}`} aria-label={t("runs.block")} title={t("runs.block")} onClick={() => onItemStatus("blocked")}><Ban size={16} /><span className={runStyles.compactActionLabel}>{t("runs.block")}</span></button><button className={`${styles.dangerButton} ${runStyles.compactAction}`} aria-label={t("runs.fail")} title={t("runs.fail")} onClick={() => onItemStatus("failed")} data-testid="fail-case"><XCircle size={16} /><span className={runStyles.compactActionLabel}>{t("runs.fail")}</span></button><button className={`${styles.successButton} ${runStyles.compactAction}`} aria-label={t("runs.pass")} onClick={() => onItemStatus("passed")} data-testid="pass-case" disabled={!canPass} title={!canPass ? t("runs.passRequiredFirst") : t("runs.pass")}><CheckCircle2 size={16} /><span className={runStyles.compactActionLabel}>{t("runs.pass")}</span></button><label className={`${styles.secondaryButton} ${runStyles.wideAction}`} aria-label={t("runs.addEvidence")} title={t("runs.addEvidence")}><Paperclip size={16} /><span className={runStyles.mobileActionLabel}>{t("runs.addEvidence")}</span> {evidence.length > 0 && <span>{evidence.length}</span>}<input id={`run-evidence-${selectedItem.id}`} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => void addEvidence(Array.from(event.target.files ?? []))} /></label>{failed && failedStep && <button className={`${styles.reportButton} ${runStyles.wideAction}`} type="button" aria-label={t("runs.reportBug")} title={t("runs.reportBug")} onClick={() => setReporting(true)} data-testid="report-defect"><Bug size={16} /><span className={runStyles.mobileActionLabel}>{t("runs.reportBug")}</span></button>}</>}</div>
      {evidenceError && <FormError message={evidenceError} />}
      <div className={runStyles.completion}>{canComplete ? <button className={styles.primaryButton} onClick={onComplete}><CheckCircle2 size={16} /> {t("runs.complete")}</button> : <span>{t("runs.percentComplete", { percent: progress })}</span>}</div>
    </footer>}
  </div>;
}
