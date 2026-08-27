import { Bug, ExternalLink, Image as ImageIcon, Paperclip, RefreshCw, Video } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Defect, RunItem, TestRun, TestStep } from "../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../application/defects/createDefect";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { FormError } from "../common/error/FormError";
import { Field } from "../common/field/Field";
import styles from "../../tms.module.css";
export function InlineDefectComposer({ projectId, run, item, step, offline, onCreated }: { projectId: string; run: TestRun; item: RunItem; step: TestStep; offline: boolean; onCreated: (defect: Defect) => void }) {
  const attempt = item.attempts.find((entry) => entry.id === item.activeAttemptId) ?? item.attempts[0];
  const failedResult = attempt.stepResults.find((entry) => entry.stepId === step.id);
  const observed = failedResult?.actualResult || attempt.actualResult || "Observed result differs from the expected behavior.";
  const [title, setTitle] = useState(observed);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [priority, setPriority] = useState<Defect["priority"]>("high");
  const [category, setCategory] = useState("Functional");
  const [description, setDescription] = useState(`After ${step.action.toLowerCase()}, the observed behavior does not match the expected result.`);
  const [repro, setRepro] = useState(`${executableSteps(item.snapshot).map((entry, index) => `${index + 1}. ${entry.action}.`).join("\n")}\n\nActual: ${observed}`);
  const [link, setLink] = useState(run.environment.baseUrl);
  const [files, setFiles] = useState<File[]>([]);
  const [created, setCreated] = useState<Defect | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || created) return;
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect, "id" | "key" | "createdAt"> = { projectId, title, description: `${description}\n\nRepro steps:\n${repro}`, severity, priority, status: "open", reproducibility: "Always", assignee: "QA Team", component: category, labels: ["manual-run", run.type], runId: run.id, runItemId: item.id, stepId: step.id, expectedResult: step.expectedResult, actualResult: observed };
    try {
      const next = await createDefect({ projectId, payload, files, link, offline });
      setCreated(next);
      onCreated(next);
    } catch {
      setError("The bug report was not saved. Check the TMS API and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form id={`defect-form-${item.id}`} className={styles.inlineDefect} onSubmit={submit} data-testid="inline-defect-composer">
    <div className={styles.inlineDefectHeader}><div><Bug size={17} /><h2>Defect for step {step.order}</h2></div><label>Link step <select value={step.id} disabled><option value={step.id}>{step.order}</option></select></label></div>
    <div className={styles.inlineDefectGrid}>
      <div className={styles.inlineDefectFields}>
        <Field label="Title" wide><input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label="Severity"><select value={severity} onChange={(event) => setSeverity(event.target.value as Defect["severity"])}><option value="critical">Critical</option><option value="high">Major</option><option value="medium">Minor</option><option value="low">Low</option></select></Field>
        <Field label="Priority"><select value={priority} onChange={(event) => setPriority(event.target.value as Defect["priority"])}><option value="critical">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
        <Field label="Category" wide><input value={category} onChange={(event) => setCategory(event.target.value)} /></Field>
        <Field label="Description" wide><textarea required value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field label="Repro steps" wide><textarea required value={repro} onChange={(event) => setRepro(event.target.value)} /></Field>
      </div>
      <div className={styles.inlineDefectEvidence}>
        <span>Evidence</span>
        <label className={styles.inlineUpload} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files)); }}><ImageIcon size={26} /><strong>Drag and drop files here</strong><small>or click to choose files</small><em>Screenshots, videos, logs, or any file</em><input id={`inline-evidence-${item.id}`} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label>
        {files.length > 0 && <div className={styles.inlineFiles}>{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{/\.(mp4|mov|webm)$/i.test(file.name) ? <Video size={14} /> : <Paperclip size={14} />}{file.name}</span>)}</div>}
        <Field label="Deep link or external URL" wide><div className={styles.linkInput}><input value={link} onChange={(event) => setLink(event.target.value)} /><ExternalLink size={15} /></div></Field>
        <div className={styles.snapshotNote}><RefreshCw size={16} /><span><strong>Run snapshot</strong><small>Revision and configuration stay immutable in this run.</small></span></div>
      </div>
    </div>
    {error && <FormError message={error} />}
    <div className={styles.inlineDefectFooter}><span>{created ? `${created.key} linked to this step` : `${item.caseKey} · ${run.environment.name} · ${run.build}`}</span><small>{submitting ? "Creating linked defect…" : created ? "Saved" : "Use Report bug below to save"}</small></div>
  </form>;
}
