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
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { getDefectDialogCopy } from "./copy";
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
  const { locale } = useTmsLocale();
  const copy = getDefectDialogCopy(locale);
  const attempt =
    item?.attempts.find((entry) => entry.id === item.activeAttemptId) ??
    item?.attempts[0];
  const failedStep = item
    ? executableSteps(item.snapshot, locale).find(
        (step) =>
          attempt?.stepResults.find((result) => result.stepId === step.id)
            ?.status === "failed",
      )
    : undefined;
  const [title, setTitle] = useState(
    item
      ? `${item.snapshot.title} ${copy.failsOn} ${run?.environment.name ?? copy.testEnvironment}`
      : "",
  );
  const [description, setDescription] = useState(item?.snapshot.description ?? "");
  const [actual, setActual] = useState(
    attempt?.actualResult ?? copy.defaultActual,
  );
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [reproducibility, setReproducibility] = useState("Always");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    const payload: Omit<Defect, "id" | "key" | "createdAt"> = {
      projectId,
      title,
      description,
      severity,
      priority: severity,
      status: "open",
      reproducibility,
      assignee: "QA Team",
      component:
        item?.snapshot.component ??
        (locale === "ru" ? "Основной продукт" : "Core product"),
      labels: ["manual-run", run?.type ?? "reported"],
      runId: run?.id ?? null,
      runItemId: item?.id ?? null,
      stepId: failedStep?.id ?? null,
      expectedResult: failedStep?.expectedResult ?? "",
      actualResult: actual,
    };
    try {
      onCreated(
        await createDefect({ projectId, payload, files, link, offline, locale }),
      );
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={copy.title}
      subtitle={
        item
          ? `${item.caseKey} · ${run?.name} · ${run?.environment.name}`
          : copy.subtitle
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className={styles.formGrid}>
          <Field label={copy.summary} wide>
            <input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} data-testid="defect-title" />
          </Field>
          <Field label={copy.severity}>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as Defect["severity"])}>
              <option value="low">{copy.low}</option><option value="medium">{copy.medium}</option><option value="high">{copy.high}</option><option value="critical">{copy.critical}</option>
            </select>
          </Field>
          <Field label={copy.reproducibility}>
            <select value={reproducibility} onChange={(event) => setReproducibility(event.target.value)}>
              <option value="Always">{copy.always}</option><option value="Sometimes">{copy.sometimes}</option><option value="Once">{copy.once}</option>
            </select>
          </Field>
          <Field label={copy.description} wide>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label={copy.expected} wide>
            <textarea value={failedStep?.expectedResult ?? ""} readOnly />
          </Field>
          <Field label={copy.actual} wide>
            <textarea required value={actual} onChange={(event) => setActual(event.target.value)} />
          </Field>
          <Field label={copy.deepLink} wide>
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder={copy.linkPlaceholder} />
          </Field>
        </div>
        <div className={styles.reportEvidence}>
          <label tabIndex={0} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") event.currentTarget.querySelector("input")?.click();
          }}>
            <ImageIcon size={18} />
            <span><strong>{copy.addEvidence}</strong><small>{copy.evidenceFormats}</small></span>
            <input type="file" multiple accept="image/*,video/*,.log,.txt,.pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
          </label>
          {files.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}><Paperclip size={13} />{file.name}</span>
          ))}
        </div>
        {error && <FormError message={copy.error} />}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button>
          <button className={styles.dangerButton} data-testid="create-defect" disabled={submitting}>
            <Bug size={16} /> {submitting ? copy.creating : copy.create}
          </button>
        </div>
      </form>
    </Modal>
  );
}
