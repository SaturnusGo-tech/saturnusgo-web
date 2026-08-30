import { Bug, ExternalLink, Image as ImageIcon, Paperclip, RefreshCw, Video, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Defect, RunItem, TestRunSummary, TestStep } from "../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../application/defects/createDefect";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../attachments/presentation/context/AttachmentClientProvider";
import { inferDefectIntegrationTarget } from "../../defects/model/integration-target";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../localization/format/labels";
import { FormError } from "../common/error/FormError";
import { Field } from "../common/field/Field";
import { AnimatedSelect } from "../common/select/AnimatedSelect";
import { getDefectDialogCopy } from "../dialogs/defect/copy";
import runStyles from "./runs.module.css";
export function InlineDefectComposer({ projectId, run, item, step, components, offline, onCreated }: { projectId: string; run: TestRunSummary; item: RunItem; step: TestStep; components: string[]; offline: boolean; onCreated: (defect: Defect) => void }) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale, t } = useTmsLocale();
  const defectCopy = getDefectDialogCopy(locale);
  const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ?? item.attempts[0];
  const localizedStep = executableSteps(item.snapshot, locale).find((entry) => entry.id === step.id) ?? step;
  const failedResult = attempt.stepResults.find((entry) => entry.stepId === step.id);
  const observed = failedResult?.actualResult || attempt.actualResult || t("inlineDefect.observedDefault");
  const [title, setTitle] = useState(observed);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [priority, setPriority] = useState<Defect["priority"]>("high");
  const componentOptions = Array.from(new Set([item.snapshot.component, ...components].map((value) => value.trim()).filter(Boolean)));
  if (componentOptions.length === 0) componentOptions.push("Core product");
  const localizedComponentOptions = componentOptions.map((value) => ({
    value,
    label: localizedComponentLabel(locale, value),
  }));
  const [component, setComponent] = useState(componentOptions[0]);
  const [integrationTarget, setIntegrationTarget] = useState<Defect["integrationTarget"]>(() =>
    inferDefectIntegrationTarget(item.snapshot.tags, item.snapshot.component));
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
    const payload: Omit<Defect, "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue"> = { projectId, title, description: `${description}\n\n${t("inlineDefect.reproSection")}:\n${repro}`, severity, priority, status: "open", reproducibility: "Always", assigneeIdentityId: null, component, integrationTarget, labels: ["manual-run", run.type], runId: run.id, runItemId: item.id, stepId: step.id, expectedResult: localizedStep.expectedResult, actualResult: observed };
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

  return <form id={`defect-form-${item.id}`} className={runStyles.defect} onSubmit={submit} data-testid="inline-defect-composer">
    <div className={runStyles.defectHeader}><div><Bug size={17} /><h2>{t("inlineDefect.step", { step: step.order })}</h2></div><div className={runStyles.defectStep}><span>{t("inlineDefect.linkStep")}</span><strong className={runStyles.defectStepValue}>{step.order}</strong></div></div>
    <div className={runStyles.defectGrid}>
      <div className={runStyles.defectFields}>
        <Field label={t("inlineDefect.title")} wide><input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label={t("inlineDefect.severity")}><AnimatedSelect label={t("inlineDefect.severity")} value={severity} onChange={(value) => setSeverity(value as Defect["severity"])} options={[{ value: "critical", label: t("severity.critical") }, { value: "high", label: t("severity.major") }, { value: "medium", label: t("severity.minor") }, { value: "low", label: t("severity.low") }]} /></Field>
        <Field label={t("inlineDefect.priority")}><AnimatedSelect label={t("inlineDefect.priority")} value={priority} onChange={(value) => setPriority(value as Defect["priority"])} options={[{ value: "critical", label: t("inlineDefect.priorityUrgent") }, { value: "high", label: t("priority.high") }, { value: "medium", label: t("priority.medium") }, { value: "low", label: t("priority.low") }]} /></Field>
        <Field label={t("inlineDefect.category")} wide><AnimatedSelect label={t("inlineDefect.category")} value={component} onChange={setComponent} options={localizedComponentOptions} /></Field>
        <Field label={defectCopy.youTrackTarget} wide><AnimatedSelect label={defectCopy.youTrackTarget}
          value={integrationTarget ?? "none"}
          onChange={(value) => setIntegrationTarget(value === "none" ? null : value as Exclude<Defect["integrationTarget"], null>)}
          options={[{ value: "none", label: defectCopy.tmsOnly },
            { value: "android", label: defectCopy.youTrackAndroid },
            { value: "ios", label: defectCopy.youTrackIos },
            { value: "backend", label: defectCopy.youTrackBackend }]} /></Field>
        <Field label={t("inlineDefect.description")} wide><textarea required value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field label={t("inlineDefect.reproSteps")} wide><textarea required value={repro} onChange={(event) => setRepro(event.target.value)} /></Field>
      </div>
      <div className={runStyles.defectEvidence}>
        <span>{t("inlineDefect.evidence")}</span>
        <label className={runStyles.upload} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.querySelector("input")?.click(); } }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files)); }}><ImageIcon size={26} /><strong>{t("inlineDefect.dropFiles")}</strong><small>{t("inlineDefect.chooseFiles")}</small><em>{t("inlineDefect.fileTypes")}</em><input id={`inline-evidence-${item.id}`} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label>
        {files.length > 0 && <div className={runStyles.files}>{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{/\.(mp4|mov|webm)$/i.test(file.name) ? <Video size={14} /> : <Paperclip size={14} />}{file.name}<button type="button" aria-label={`${t("inlineDefect.removeFile")} ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>)}</div>}
        <Field label={t("inlineDefect.deepLink")} wide><div className={runStyles.linkInput}><input value={link} onChange={(event) => setLink(event.target.value)} /><ExternalLink size={15} /></div></Field>
        <div className={runStyles.snapshot}><RefreshCw size={16} /><span><strong>{t("inlineDefect.runSnapshot")}</strong><small>{t("inlineDefect.runSnapshotHint")}</small></span></div>
      </div>
    </div>
    {error && <FormError message={error} />}
    <div className={runStyles.defectFooter}><span>{created ? t("inlineDefect.linked", { key: created.key }) : `${item.caseKey} · ${run.environment.name} · ${run.build}`}</span><small>{submitting ? t("inlineDefect.creating") : created ? t("inlineDefect.saved") : t("inlineDefect.saveHint")}</small></div>
  </form>;
}
