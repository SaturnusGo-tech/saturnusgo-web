import { Bug, ExternalLink, Image as ImageIcon, Paperclip, RefreshCw, Video } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Defect, RunItem, TestRunSummary, TestStep } from "../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../application/defects/createDefect";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../attachments/presentation/context/AttachmentClientProvider";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { FormError } from "../common/error/FormError";
import { Field } from "../common/field/Field";
import styles from "../../tms.module.css";
export function InlineDefectComposer({ projectId, run, item, step, offline, onCreated }: { projectId: string; run: TestRunSummary; item: RunItem; step: TestStep; offline: boolean; onCreated: (defect: Defect) => void }) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale, t } = useTmsLocale();
  const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ?? item.attempts[0];
  const localizedStep = executableSteps(item.snapshot, locale).find((entry) => entry.id === step.id) ?? step;
  const failedResult = attempt.stepResults.find((entry) => entry.stepId === step.id);
  const observed = failedResult?.actualResult || attempt.actualResult || t("inlineDefect.observedDefault");
  const [title, setTitle] = useState(observed);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [priority, setPriority] = useState<Defect["priority"]>("high");
  const [category, setCategory] = useState(t("inlineDefect.categoryDefault"));
  const [description, setDescription] = useState(t("inlineDefect.descriptionDefault", { action: step.action }));
  const [repro, setRepro] = useState(`${executableSteps(item.snapshot).map((entry, index) => `${index + 1}. ${entry.action}.`).join("\n")}\n\n${t("inlineDefect.actualPrefix")}: ${observed}`);
  const [link, setLink] = useState(/^https:\/\//i.test(run.environment.baseUrl)
    ? run.environment.baseUrl
    : "");
  const [files, setFiles] = useState<File[]>([]);
  const [created, setCreated] = useState<Defect | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [operationKey] = useState(() => crypto.randomUUID());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || created) return;
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect, "id" | "key" | "createdAt" | "attachmentIds" | "linkIds"> = { projectId, title, description: `${description}\n\n${t("inlineDefect.reproSection")}:\n${repro}`, severity, priority, status: "open", reproducibility: "Always", assigneeIdentityId: null, component: category, labels: ["manual-run", run.type], runId: run.id, runItemId: item.id, stepId: step.id, expectedResult: localizedStep.expectedResult, actualResult: observed };
    try {
      const next = await createDefect({ http, attachments, projectId, payload, files, operationKey, link, offline, locale });
      setCreated(next);
      onCreated(next);
    } catch {
      setError(t("inlineDefect.saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  return <form id={`defect-form-${item.id}`} className={styles.inlineDefect} onSubmit={submit} data-testid="inline-defect-composer">
    <div className={styles.inlineDefectHeader}><div><Bug size={17} /><h2>{t("inlineDefect.step", { step: step.order })}</h2></div><label>{t("inlineDefect.linkStep")} <select value={step.id} disabled><option value={step.id}>{step.order}</option></select></label></div>
    <div className={styles.inlineDefectGrid}>
      <div className={styles.inlineDefectFields}>
        <Field label={t("inlineDefect.title")} wide><input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label={t("inlineDefect.severity")}><select value={severity} onChange={(event) => setSeverity(event.target.value as Defect["severity"])}><option value="critical">{t("severity.critical")}</option><option value="high">{t("severity.major")}</option><option value="medium">{t("severity.minor")}</option><option value="low">{t("severity.low")}</option></select></Field>
        <Field label={t("inlineDefect.priority")}><select value={priority} onChange={(event) => setPriority(event.target.value as Defect["priority"])}><option value="critical">{t("inlineDefect.priorityUrgent")}</option><option value="high">{t("priority.high")}</option><option value="medium">{t("priority.medium")}</option><option value="low">{t("priority.low")}</option></select></Field>
        <Field label={t("inlineDefect.category")} wide><input value={category} onChange={(event) => setCategory(event.target.value)} /></Field>
        <Field label={t("inlineDefect.description")} wide><textarea required value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field label={t("inlineDefect.reproSteps")} wide><textarea required value={repro} onChange={(event) => setRepro(event.target.value)} /></Field>
      </div>
      <div className={styles.inlineDefectEvidence}>
        <span>{t("inlineDefect.evidence")}</span>
        <label className={styles.inlineUpload} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files)); }}><ImageIcon size={26} /><strong>{t("inlineDefect.dropFiles")}</strong><small>{t("inlineDefect.chooseFiles")}</small><em>{t("inlineDefect.fileTypes")}</em><input id={`inline-evidence-${item.id}`} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label>
        {files.length > 0 && <div className={styles.inlineFiles}>{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{/\.(mp4|mov|webm)$/i.test(file.name) ? <Video size={14} /> : <Paperclip size={14} />}{file.name}</span>)}</div>}
        <Field label={t("inlineDefect.deepLink")} wide><div className={styles.linkInput}><input value={link} onChange={(event) => setLink(event.target.value)} /><ExternalLink size={15} /></div></Field>
        <div className={styles.snapshotNote}><RefreshCw size={16} /><span><strong>{t("inlineDefect.runSnapshot")}</strong><small>{t("inlineDefect.runSnapshotHint")}</small></span></div>
      </div>
    </div>
    {error && <FormError message={error} />}
    <div className={styles.inlineDefectFooter}><span>{created ? t("inlineDefect.linked", { key: created.key }) : `${item.caseKey} · ${run.environment.name} · ${run.build}`}</span><small>{submitting ? t("inlineDefect.creating") : created ? t("inlineDefect.saved") : t("inlineDefect.saveHint")}</small></div>
  </form>;
}
