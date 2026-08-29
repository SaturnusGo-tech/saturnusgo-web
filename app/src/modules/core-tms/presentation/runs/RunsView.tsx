import { Ban, Bug, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Paperclip, Play, PlayCircle, Plus, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Defect, ExecutionStatus, RunItem, RunItemSummary, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { uploadEvidence } from "../../application/evidence/uploadEvidence";
import { useAttachmentClient } from "../../attachments/presentation/context/AttachmentClientProvider";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { FormError } from "../common/error/FormError";
import { statusIcon } from "../status/executionStatus";
import { InlineDefectComposer } from "./InlineDefectComposer";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";
import styles from "../../tms.module.css";
type RunsViewProps = {
  offline: boolean;
  runs: TestRunSummary[];
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
  onDefectCreated: (defect: Defect) => void;
};

export function RunsView({ offline, runs, selectedRun, items, selectedItem, progress, onSelectRun, onSelectItem, onCreate, onStepStatus, onStepActual, onItemStatus, onComplete, onDefectCreated }: RunsViewProps) {
  const { locale, t } = useTmsLocale();
  const attachments = useAttachmentClient();
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
    if (!selectedRun || !selectedItem) return;
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const index = items.findIndex((item) => item.id === selectedItem!.id);
      const activeAttempt = selectedItem!.attempts.find((item) => item.attemptNo === selectedItem!.activeAttemptNo) ?? selectedItem!.attempts[0];
      const requiredPassed = executableSteps(selectedItem!.snapshot).filter((step) => step.required).every((step) => activeAttempt.stepResults.find((result) => result.stepId === step.id)?.status === "passed");
      const hasFailure = selectedItem!.status === "failed" || activeAttempt.stepResults.some((result) => result.status === "failed");
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.key === "[") { event.preventDefault(); const previous = items[index - 1]; if (previous) onSelectItem(previous.id); }
      else if ((event.metaKey || event.ctrlKey) && event.key === "]") { event.preventDefault(); const next = items[index + 1]; if (next) onSelectItem(next.id); }
      else if (key === "b" && selectedRun!.status === "active") { event.preventDefault(); onItemStatus("blocked"); }
      else if (key === "f" && selectedRun!.status === "active") { event.preventDefault(); onItemStatus("failed"); }
      else if (key === "p" && selectedRun!.status === "active" && requiredPassed) { event.preventDefault(); onItemStatus("passed"); }
      else if (key === "e") { event.preventDefault(); document.getElementById(`run-evidence-${selectedItem!.id}`)?.click(); }
      else if (key === "r" && hasFailure) { event.preventDefault(); setReporting(true); }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [items, onItemStatus, onSelectItem, selectedItem, selectedRun]);
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
  if (!selectedRun || !selectedItem) return <div className={`${styles.pane} ${styles.centeredPane}`}><EmptyState icon={<PlayCircle size={36} />} title={t("runs.noActive")} text={t("runs.noActiveHint")} action={<button className={styles.primaryButton} onClick={onCreate} data-testid="new-run"><Play size={16} /> {t("runs.start")}</button>} /></div>;
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
  const canComplete = selectedRun.status === "active" && items.every((item) => ["passed", "failed", "blocked", "skipped"].includes(item.status));
  const currentIndex = items.findIndex((item) => item.id === selectedItem.id);
  return <div className={styles.executionShell} data-testid="runs-view">
    <aside className={`${styles.pane} ${styles.runQueue}`}>
      <div className={styles.runPicker}><select aria-label={t("runs.current")} value={selectedRun.id} onChange={(event) => onSelectRun(event.target.value)}>{runs.map((run) => <option value={run.id} key={run.id}>{run.name}</option>)}</select><button className={styles.runCreateButton} aria-label={t("runs.new")} title={t("runs.new")} onClick={onCreate} data-testid="new-run"><Plus size={15} /><span>{t("runs.newShort")}</span></button></div>
      <div className={styles.runSummary}><div><span>{selectedRun.key}</span><b>{localizedLabel(locale, selectedRun.type)}</b></div><h2>{selectedRun.name}</h2><small>{selectedRun.environment.name} · {selectedRun.build}</small><div className={styles.progressBar}><i style={{ width: `${progress}%` }} /></div><strong>{t("runs.percentComplete", { percent: progress })} <em>{selectedRun.progress.executed} / {selectedRun.itemCount}</em></strong></div>
      <div className={styles.runItems}>{items.map((item, index) => <button className={`${styles.runItem} ${item.id === selectedItem.id ? styles.runItemActive : ""}`} key={item.id} onClick={() => onSelectItem(item.id)}><span className={`${styles.statusIcon} ${styles[`status_${item.status}`]}`}>{statusIcon[item.status]}</span><div><small>{index + 1} · {item.caseKey}</small><strong>{t("cases.revision", { revision: item.revision })}</strong></div><ChevronRight size={14} /></button>)}</div>
    </aside>
    <section className={`${styles.pane} ${styles.executionPane}`}>
      <div className={styles.executionHeader}><div><span>{selectedItem.caseKey}</span><h1>{selectedItem.snapshot.title}</h1><p>{selectedItem.snapshot.description}</p></div><span className={`${styles.statusPill} ${styles[`status_${selectedItem.status}`]}`}>{statusIcon[selectedItem.status]} {localizedLabel(locale, selectedItem.status)}</span><button className={styles.iconButton} aria-label={t("runs.copyCaseKey")} title={t("runs.copyCaseKey")} onClick={() => navigator.clipboard?.writeText(selectedItem.caseKey)}><Copy size={17} /></button></div>
      <div className={styles.executionMeta}><span><strong>{t("runs.environment")}</strong>{selectedRun.environment.name}</span><span><strong>{t("runs.build")}</strong>{selectedRun.build}</span><span><strong>{t("runs.estimate")}</strong>{selectedItem.snapshot.estimatedMinutes ?? "—"} {locale === "ru" ? "мин" : "min"}</span></div>
      <div className={styles.precondition}><strong>{t("runs.preconditions")}</strong><p>{selectedItem.snapshot.preconditions}</p></div>
      <div className={styles.executionSteps}>
        <div className={styles.executionStepHead}>{[t("runs.number"), t("runs.action"), t("runs.expected"), t("runs.actual"), t("runs.status")].map((label) => <span key={label}>{label}</span>)}</div>
        {executionEntries.map((step) => {
          const result = attempt.stepResults.find((item) => item.stepId === step.id);
          const status = result?.status ?? "not_run";
          return <article className={`${styles.executionStep} ${styles[`step_${status}`]}`} key={step.id}>
            <div className={styles.stepNumber}>{step.order}</div>
            <div className={styles.stepAction}><small className={styles.stepCellLabel}>{t("runs.action")}</small><span>{step.action}</span></div>
            <div className={styles.stepExpected}><small className={styles.stepCellLabel}>{t("runs.expected")}</small><span>{step.expectedResult}</span></div>
            <div className={styles.stepActual}><small className={styles.stepCellLabel}>{t("runs.actual")}</small>{status === "failed" ? <textarea aria-label={`${t("runs.actual")}: ${step.order}`} value={result?.actualResult ?? ""} onChange={(event) => onStepActual(step.id, event.target.value)} placeholder={t("runs.actualPlaceholder")} /> : <span>{status === "passed" ? result?.actualResult || step.expectedResult : result?.actualResult || "—"}</span>}</div>
            <div className={styles.stepStatus}>
              <span className={`${styles.statusPill} ${styles[`status_${status}`]}`}>{statusIcon[status]} {localizedLabel(locale, status)}</span>
              {selectedRun.status === "active" && <div className={styles.stepActions}><button aria-label={`${t("runs.passStep")} ${step.order}`} title={t("runs.passStep")} className={status === "passed" ? styles.actionPassActive : ""} onClick={() => onStepStatus(step.id, "passed")}><Check size={15} /></button><button aria-label={`${t("runs.failStep")} ${step.order}`} title={t("runs.failStep")} className={status === "failed" ? styles.actionFailActive : ""} onClick={() => onStepStatus(step.id, "failed")}><X size={15} /></button><button aria-label={`${t("runs.blockStep")} ${step.order}`} title={t("runs.blockStep")} className={status === "blocked" ? styles.actionBlockActive : ""} onClick={() => onStepStatus(step.id, "blocked")}><Ban size={14} /></button></div>}
            </div>
          </article>;
        })}
      </div>
      {attachmentIds.length > 0 && <section className={styles.runEvidence}><strong>{t("runs.evidence")}</strong><div className={styles.attachmentGrid}>{attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}</div></section>}
      {reporting && failed && failedStep && <InlineDefectComposer key={`${selectedRun.id}-${selectedItem.id}-${failedStep.id}`} projectId={selectedRun.projectId} run={selectedRun} item={selectedItem} step={failedStep} offline={offline} onCreated={onDefectCreated} />}
    </section>
    {selectedRun.status === "active" && <footer className={styles.executionFooter}>
      <div className={styles.executionPager}><button className={styles.textButton} disabled={currentIndex <= 0} onClick={() => onSelectItem(items[currentIndex - 1]?.id)}><ChevronLeft size={16} /> {t("runs.previous")}</button><button className={styles.textButton} disabled={currentIndex >= items.length - 1} onClick={() => onSelectItem(items[currentIndex + 1]?.id)}>{t("runs.next")} <ChevronRight size={16} /></button></div>
      <div className={styles.executionActions}>{selectedRun.status === "active" && <><button className={styles.secondaryButton} onClick={() => onItemStatus("blocked")}><Ban size={16} /> {t("runs.block")}</button><button className={styles.dangerButton} onClick={() => onItemStatus("failed")} data-testid="fail-case"><XCircle size={16} /> {t("runs.fail")}</button><button className={styles.successButton} onClick={() => onItemStatus("passed")} data-testid="pass-case" disabled={!canPass} title={!canPass ? t("runs.passRequiredFirst") : undefined}><CheckCircle2 size={16} /> {t("runs.pass")}</button><label className={styles.secondaryButton}><Paperclip size={16} /> {t("runs.addEvidence")} {evidence.length > 0 && <span>{evidence.length}</span>}<input id={`run-evidence-${selectedItem.id}`} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => void addEvidence(Array.from(event.target.files ?? []))} /></label>{failed && <button className={styles.reportButton} type={reporting ? "submit" : "button"} form={reporting ? `defect-form-${selectedItem.id}` : undefined} onClick={() => { if (!reporting) setReporting(true); }} data-testid="report-defect"><Bug size={16} /> {reporting ? t("runs.createBug") : t("runs.reportBug")}</button>}</>}</div>
      {evidenceError && <FormError message={evidenceError} />}
      <div className={styles.executionCompletion}>{canComplete ? <button className={styles.primaryButton} onClick={onComplete}><CheckCircle2 size={16} /> {t("runs.complete")}</button> : <span>{t("runs.percentComplete", { percent: progress })}</span>}</div>
    </footer>}
  </div>;
}
