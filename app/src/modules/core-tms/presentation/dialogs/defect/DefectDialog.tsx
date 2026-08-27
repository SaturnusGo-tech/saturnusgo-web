import { Bug, Image as ImageIcon, Paperclip } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type {
  Defect,
  RunItem,
  TestRun,
} from "../../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../../application/defects/createDefect";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";

type DefectDialogProps = {
  projectId: string;
  run: TestRun | null;
  item: RunItem | null;
  offline: boolean;
  onClose: () => void;
  onCreated: (defect: Defect) => void;
};

export function DefectDialog({
  projectId,
  run,
  item,
  offline,
  onClose,
  onCreated,
}: DefectDialogProps) {
  const attempt =
    item?.attempts.find((entry) => entry.id === item.activeAttemptId) ??
    item?.attempts[0];
  const failedStep = item
    ? executableSteps(item.snapshot).find(
        (step) =>
          attempt?.stepResults.find((result) => result.stepId === step.id)
            ?.status === "failed",
      )
    : undefined;
  const [title, setTitle] = useState(
    item
      ? `${item.snapshot.title} fails on ${run?.environment.name ?? "test environment"}`
      : "",
  );
  const [description, setDescription] = useState(item?.snapshot.description ?? "");
  const [actual, setActual] = useState(
    attempt?.actualResult ?? "Observed result differs from the expected behavior.",
  );
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [reproducibility, setReproducibility] = useState("Always");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect, "id" | "key" | "createdAt"> = {
      projectId,
      title,
      description,
      severity,
      priority: severity,
      status: "open",
      reproducibility,
      assignee: "QA Team",
      component: item?.snapshot.component ?? "Core product",
      labels: ["manual-run", run?.type ?? "reported"],
      runId: run?.id ?? null,
      runItemId: item?.id ?? null,
      stepId: failedStep?.id ?? null,
      expectedResult: failedStep?.expectedResult ?? "",
      actualResult: actual,
    };
    try {
      onCreated(
        await createDefect({ projectId, payload, files, link, offline }),
      );
    } catch {
      setError("The bug report was not saved. Check the TMS API and retry.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Report a bug"
      subtitle={
        item
          ? `${item.caseKey} · ${run?.name} · ${run?.environment.name}`
          : "Create a defect and add execution context."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className={styles.formGrid}>
          <Field label="Summary" wide>
            <input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} data-testid="defect-title" />
          </Field>
          <Field label="Severity">
            <select value={severity} onChange={(event) => setSeverity(event.target.value as Defect["severity"])}>
              <option>low</option><option>medium</option><option>high</option><option>critical</option>
            </select>
          </Field>
          <Field label="Reproducibility">
            <select value={reproducibility} onChange={(event) => setReproducibility(event.target.value)}>
              <option>Always</option><option>Sometimes</option><option>Once</option>
            </select>
          </Field>
          <Field label="Description" wide>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label="Expected result" wide>
            <textarea value={failedStep?.expectedResult ?? ""} readOnly />
          </Field>
          <Field label="Actual result" wide>
            <textarea required value={actual} onChange={(event) => setActual(event.target.value)} />
          </Field>
          <Field label="Deep link" wide>
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="app://path or https://…" />
          </Field>
        </div>
        <div className={styles.reportEvidence}>
          <label tabIndex={0} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") event.currentTarget.querySelector("input")?.click();
          }}>
            <ImageIcon size={18} />
            <span><strong>Add screenshots or screencasts</strong><small>PNG, JPG, MP4, MOV, logs, PDF</small></span>
            <input type="file" multiple accept="image/*,video/*,.log,.txt,.pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
          </label>
          {files.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}><Paperclip size={13} />{file.name}</span>
          ))}
        </div>
        {error && <FormError message={error} />}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.textButton} onClick={onClose}>Cancel</button>
          <button className={styles.dangerButton} data-testid="create-defect" disabled={submitting}>
            <Bug size={16} /> {submitting ? "Creating…" : "Create bug report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
