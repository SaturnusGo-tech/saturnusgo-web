import { Ban, Bug, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Paperclip, Play, PlayCircle, Plus, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Defect, ExecutionStatus, RunItem, TestRun } from "../../../../core/tms/contracts/legacy-contract";
import { uploadRunItemEvidence } from "../../application/evidence/uploadRunItemEvidence";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { EmptyState } from "../common/empty/EmptyState";
import { FormError } from "../common/error/FormError";
import { statusIcon, statusLabel } from "../status/executionStatus";
import { InlineDefectComposer } from "./InlineDefectComposer";
import styles from "../../tms.module.css";
type RunsViewProps = {
  offline: boolean;
  runs: TestRun[];
  selectedRun: TestRun | null;
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

export function RunsView({ offline, runs, selectedRun, selectedItem, progress, onSelectRun, onSelectItem, onCreate, onStepStatus, onStepActual, onItemStatus, onComplete, onDefectCreated }: RunsViewProps) {
  const [evidence, setEvidence] = useState<string[]>([]);
  const [evidenceError, setEvidenceError] = useState("");
  const [reporting, setReporting] = useState(false);
  useEffect(() => {
    setReporting(false);
    setEvidence([]);
    setEvidenceError("");
  }, [selectedItem?.id, selectedRun?.id]);
  useEffect(() => {
    if (!selectedRun || !selectedItem) return;
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const index = selectedRun!.items.findIndex((item) => item.id === selectedItem!.id);
      const activeAttempt = selectedItem!.attempts.find((item) => item.id === selectedItem!.activeAttemptId) ?? selectedItem!.attempts[0];
      const requiredPassed = executableSteps(selectedItem!.snapshot).filter((step) => step.required).every((step) => activeAttempt.stepResults.find((result) => result.stepId === step.id)?.status === "passed");
      const hasFailure = selectedItem!.status === "failed" || activeAttempt.stepResults.some((result) => result.status === "failed");
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.key === "[") { event.preventDefault(); const previous = selectedRun!.items[index - 1]; if (previous) onSelectItem(previous.id); }
      else if ((event.metaKey || event.ctrlKey) && event.key === "]") { event.preventDefault(); const next = selectedRun!.items[index + 1]; if (next) onSelectItem(next.id); }
      else if (key === "b" && selectedRun!.status === "active") { event.preventDefault(); onItemStatus("blocked"); }
      else if (key === "f" && selectedRun!.status === "active") { event.preventDefault(); onItemStatus("failed"); }
      else if (key === "p" && selectedRun!.status === "active" && requiredPassed) { event.preventDefault(); onItemStatus("passed"); }
      else if (key === "e") { event.preventDefault(); document.getElementById(`run-evidence-${selectedItem!.id}`)?.click(); }
      else if (key === "r" && hasFailure) { event.preventDefault(); setReporting(true); }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onItemStatus, onSelectItem, selectedItem, selectedRun]);
  async function addEvidence(files: File[]) {
    if (!selectedRun || !selectedItem || files.length === 0) return;
    setEvidenceError("");
    try {
      await uploadRunItemEvidence({ projectId: selectedRun.projectId, runItemId: selectedItem.id, files, offline });
      setEvidence((current) => [...current, ...files.map((file) => file.name)]);
    } catch {
      setEvidenceError("Evidence was not uploaded. Check the TMS API and retry.");
    }
  }
  if (!selectedRun || !selectedItem) return <div className={`${styles.pane} ${styles.centeredPane}`}><EmptyState icon={<PlayCircle size={36} />} title="No active test run" text="Select a suite and start a smoke, regression, acceptance, or ad-hoc run." action={<button className={styles.primaryButton} onClick={onCreate} data-testid="new-run"><Play size={16} /> Start test run</button>} /></div>;
  const attempt = selectedItem.attempts.find((item) => item.id === selectedItem.activeAttemptId) ?? selectedItem.attempts[0];
  const executionEntries = executableSteps(selectedItem.snapshot);
  const failed = selectedItem.status === "failed" || attempt.stepResults.some((result) => result.status === "failed");
  const canPass = executionEntries.filter((step) => step.required).every((step) => attempt.stepResults.find((result) => result.stepId === step.id)?.status === "passed");
  const failedStep = executionEntries.find((step) => attempt.stepResults.find((result) => result.stepId === step.id)?.status === "failed") ?? executionEntries[0];
  const canComplete = selectedRun.status === "active" && selectedRun.items.every((item) => ["passed", "failed", "blocked", "skipped"].includes(item.status));
  const currentIndex = selectedRun.items.findIndex((item) => item.id === selectedItem.id);
  return <div className={styles.executionShell} data-testid="runs-view">
    <aside className={`${styles.pane} ${styles.runQueue}`}>
      <div className={styles.runPicker}><select aria-label="Current test run" value={selectedRun.id} onChange={(event) => onSelectRun(event.target.value)}>{runs.map((run) => <option value={run.id} key={run.id}>{run.name}</option>)}</select><button className={styles.runCreateButton} aria-label="New test run" title="New test run" onClick={onCreate} data-testid="new-run"><Plus size={15} /><span>New run</span></button></div>
      <div className={styles.runSummary}><div><span>{selectedRun.key}</span><b>{selectedRun.type}</b></div><h2>{selectedRun.name}</h2><small>{selectedRun.environment.name} · {selectedRun.build}</small><div className={styles.progressBar}><i style={{ width: `${progress}%` }} /></div><strong>{progress}% complete <em>{selectedRun.items.filter((item) => item.status !== "not_run").length} / {selectedRun.items.length}</em></strong></div>
      <div className={styles.runItems}>{selectedRun.items.map((item, index) => <button className={`${styles.runItem} ${item.id === selectedItem.id ? styles.runItemActive : ""}`} key={item.id} onClick={() => onSelectItem(item.id)}><span className={`${styles.statusIcon} ${styles[`status_${item.status}`]}`}>{statusIcon[item.status]}</span><div><small>{index + 1} · {item.caseKey}</small><strong>{item.snapshot.title}</strong></div><ChevronRight size={14} /></button>)}</div>
    </aside>
    <section className={`${styles.pane} ${styles.executionPane}`}>
      <div className={styles.executionHeader}><div><span>{selectedItem.caseKey}</span><h1>{selectedItem.snapshot.title}</h1><p>{selectedItem.snapshot.description}</p></div><span className={`${styles.statusPill} ${styles[`status_${selectedItem.status}`]}`}>{statusIcon[selectedItem.status]} {statusLabel[selectedItem.status]}</span><button className={styles.iconButton} aria-label="Copy test case key" title="Copy test case key" onClick={() => navigator.clipboard?.writeText(selectedItem.caseKey)}><Copy size={17} /></button></div>
      <div className={styles.executionMeta}><span><strong>Environment</strong>{selectedRun.environment.name}</span><span><strong>Build</strong>{selectedRun.build}</span><span><strong>Estimate</strong>{selectedItem.snapshot.estimatedMinutes ?? "—"} min</span></div>
      <div className={styles.precondition}><strong>Preconditions</strong><p>{selectedItem.snapshot.preconditions}</p></div>
      <div className={styles.executionSteps}>
        <div className={styles.executionStepHead}><span>#</span><span>Action</span><span>Expected result</span><span>Actual result</span><span>Status</span></div>
        {executionEntries.map((step) => {
          const result = attempt.stepResults.find((item) => item.stepId === step.id);
          const status = result?.status ?? "not_run";
          return <article className={`${styles.executionStep} ${styles[`step_${status}`]}`} key={step.id}>
            <div className={styles.stepNumber}>{step.order}</div>
            <div className={styles.stepAction}><small className={styles.stepCellLabel}>Action</small><span>{step.action}</span></div>
            <div className={styles.stepExpected}><small className={styles.stepCellLabel}>Expected result</small><span>{step.expectedResult}</span></div>
            <div className={styles.stepActual}><small className={styles.stepCellLabel}>Actual result</small>{status === "failed" ? <textarea aria-label={`Actual result for step ${step.order}`} value={result?.actualResult ?? ""} onChange={(event) => onStepActual(step.id, event.target.value)} placeholder="Describe the observed result…" /> : <span>{status === "passed" ? result?.actualResult || step.expectedResult : result?.actualResult || "—"}</span>}</div>
            <div className={styles.stepStatus}>
              <span className={`${styles.statusPill} ${styles[`status_${status}`]}`}>{statusIcon[status]} {statusLabel[status]}</span>
              <div className={styles.stepActions}><button disabled={selectedRun.status !== "active"} aria-label={`Pass step ${step.order}`} title="Pass step" className={status === "passed" ? styles.actionPassActive : ""} onClick={() => onStepStatus(step.id, "passed")}><Check size={15} /></button><button disabled={selectedRun.status !== "active"} aria-label={`Fail step ${step.order}`} title="Fail step" className={status === "failed" ? styles.actionFailActive : ""} onClick={() => onStepStatus(step.id, "failed")}><X size={15} /></button><button disabled={selectedRun.status !== "active"} aria-label={`Block step ${step.order}`} title="Block step" className={status === "blocked" ? styles.actionBlockActive : ""} onClick={() => onStepStatus(step.id, "blocked")}><Ban size={14} /></button></div>
            </div>
          </article>;
        })}
      </div>
      {reporting && failed && failedStep && <InlineDefectComposer key={`${selectedRun.id}-${selectedItem.id}-${failedStep.id}`} projectId={selectedRun.projectId} run={selectedRun} item={selectedItem} step={failedStep} offline={offline} onCreated={onDefectCreated} />}
    </section>
    <footer className={styles.executionFooter}>
      <div className={styles.executionPager}><button className={styles.textButton} disabled={currentIndex <= 0} onClick={() => onSelectItem(selectedRun.items[currentIndex - 1]?.id)}><ChevronLeft size={16} /> Previous test <kbd>⌘ [</kbd></button><button className={styles.textButton} disabled={currentIndex >= selectedRun.items.length - 1} onClick={() => onSelectItem(selectedRun.items[currentIndex + 1]?.id)}>Next test <ChevronRight size={16} /><kbd>⌘ ]</kbd></button></div>
      <div className={styles.executionActions}><button className={styles.secondaryButton} onClick={() => onItemStatus("blocked")} disabled={selectedRun.status !== "active"}><Ban size={16} /> Block <kbd>B</kbd></button><button className={styles.dangerButton} onClick={() => onItemStatus("failed")} data-testid="fail-case" disabled={selectedRun.status !== "active"}><XCircle size={16} /> Fail <kbd>F</kbd></button><button className={styles.successButton} onClick={() => onItemStatus("passed")} data-testid="pass-case" disabled={selectedRun.status !== "active" || !canPass} title={!canPass ? "Pass every required step first" : undefined}><CheckCircle2 size={16} /> Pass <kbd>P</kbd></button><label className={styles.secondaryButton}><Paperclip size={16} /> Add evidence {evidence.length > 0 && <span>{evidence.length}</span>}<kbd>E</kbd><input id={`run-evidence-${selectedItem.id}`} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => void addEvidence(Array.from(event.target.files ?? []))} /></label>{failed && <button className={styles.reportButton} type="submit" form={`defect-form-${selectedItem.id}`} onClick={() => setReporting(true)} data-testid="report-defect"><Bug size={16} /> {reporting ? "Create bug" : "Report bug"} <kbd>R</kbd></button>}</div>
      {evidenceError && <FormError message={evidenceError} />}
      <div className={styles.executionCompletion}>{selectedRun.status === "completed" ? <span className={`${styles.statusPill} ${styles.status_passed}`}><CheckCircle2 size={15} /> Run completed</span> : canComplete ? <button className={styles.primaryButton} onClick={onComplete}><CheckCircle2 size={16} /> Complete run</button> : <span>{progress}% complete</span>}</div>
    </footer>
  </div>;
}
