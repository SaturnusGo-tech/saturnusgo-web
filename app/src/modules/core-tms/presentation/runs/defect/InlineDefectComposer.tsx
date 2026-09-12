import { NarrativeField } from "../../cases/inspector/markdown/plain/NarrativeField";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { Bug, Paperclip, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Defect, RunItem, TestRunSummary, TestStep } from "../../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../../application/defects/createDefect";
import { describeDefectCreateError } from "../../../application/defects/describeDefectCreateError";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { defectClientLabels, inferLegacyDefectIntegrationTarget, resolveDefectIntegrationChoice, type DefectIntegrationChoice } from "../../../defects/model/integration-target";
import { useYouTrackRouteOptions } from "../../../defects/presentation/use-youtrack-route-options";
import { defectRouteChoices } from "../../../defects/presentation/defect-route-choices";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { getDefectDialogCopy } from "../../dialogs/defect/copy";
import shared from "../../../tms.module.css";
import { appendDefectFiles } from "../../dialogs/defect-layout/files";
import surface from "../../dialogs/defect-layout/defect-form.module.css";
import { useDrawerDismiss } from "../../common/drawer/useDrawerDismiss";
import styles from "./inline-defect.module.css";

type Props = {
  workspaceId: string;
  projectId: string;
  run: TestRunSummary;
  item: RunItem;
  step: TestStep;
  components: string[];
  offline: boolean;
  onClose: () => void;
  onCreated: (defect: Defect) => void;
};

export function InlineDefectComposer({ workspaceId, projectId, run, item, step, components, offline, onClose, onCreated }: Props) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale, t } = useTmsLocale();
  const copy = getDefectDialogCopy(locale);
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const youTrack = useYouTrackRouteOptions(workspaceId, locale);
  const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ?? item.attempts[0];
  const localizedStep = executableSteps(item.snapshot, locale).find((entry) => entry.id === step.id) ?? step;
  const failedResult = attempt.stepResults.find((entry) => entry.stepId === step.id);
  const observed = failedResult?.actualResult || attempt.actualResult || t("inlineDefect.observedDefault");
  const componentOptions = Array.from(new Set([item.snapshot.component, ...components].map((value) => value.trim()).filter(Boolean)));
  if (componentOptions.length === 0) componentOptions.push("Core product");
  const [title, setTitle] = useState(observed);
  const [assigneeIdentityId, setAssignee] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [priority, setPriority] = useState<Defect["priority"]>("high");
  const [component, setComponent] = useState(componentOptions[0]);
  const [integrationChoice, setIntegrationChoice] = useState<DefectIntegrationChoice>("");
  const { configurationVersion, enabled, options: youTrackOptions, status: youTrackStatus } = youTrack;
  useEffect(() => {
    if (configurationVersion !== 1 || !enabled || integrationChoice) return;
    const suggested = inferLegacyDefectIntegrationTarget(item.snapshot.tags, item.snapshot.component);
    if (suggested && youTrackOptions.some((option) => option.value === suggested)) setIntegrationChoice(suggested);
  }, [configurationVersion, enabled, integrationChoice, item, youTrackOptions]);
  const routing = resolveDefectIntegrationChoice(
    integrationChoice, offline || (youTrackStatus === "ready" && (configurationVersion === 2 || !enabled)),
  );
  const routeOptions = offline ? [{ value: "", label: copy.projectIntegrations }]
    : youTrackStatus === "loading" ? [{ value: "", label: copy.youTrackLoading }]
    : youTrackStatus === "error" ? [{ value: "", label: copy.youTrackUnavailable }]
    : defectRouteChoices(youTrack, copy);
  const routingMessage = youTrackStatus === "error" ? copy.youTrackUnavailable
    : youTrackStatus === "loading" ? copy.youTrackLoading : copy.youTrackRequired;
  const [description, setDescription] = useState(t("inlineDefect.descriptionDefault", { action: step.action }));
  const [repro, setRepro] = useState(`${executableSteps(item.snapshot).map((entry, index) => `${index + 1}. ${entry.action}.`).join("\n")}\n\n${t("inlineDefect.actualPrefix")}: ${observed}`);
  const [link, setLink] = useState(/^https:\/\//i.test(run.environment.baseUrl) ? run.environment.baseUrl : "");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [operationKey] = useState(() => crypto.randomUUID());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!description.trim()) { setError(locale === "ru" ? "Добавьте описание дефекта." : "Add a defect description."); return; }
    if (!routing.resolved) { setError(copy.youTrackRequired); return; }
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect, "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue"> = {
      projectId, title, description: `${description}\n\n${t("inlineDefect.reproSection")}:\n${repro}`,
      severity, priority, status: "open", reproducibility: "Always", assigneeIdentityId,
      component, integrationTarget: routing.target,
      labels: defectClientLabels(true), runId: run.id, runItemId: item.id,
      stepId: step.id, expectedResult: localizedStep.expectedResult, actualResult: observed,
    };
    try {
      const next = await createDefect({ http, attachments, projectId, payload, files, operationKey, link, offline, locale });
      dismiss(() => { onCreated(next); onClose(); });
    } catch (caught) {
      setError(describeDefectCreateError(caught, t("inlineDefect.saveError"), locale));
      setSubmitting(false);
    }
  }

  const componentChoices = componentOptions.map((value) => ({ value, label: localizedComponentLabel(locale, value) }));
  return <Modal title={t("inlineDefect.step", { step: step.order })} subtitle={`${item.caseKey} · ${run.environment.name} · ${run.build}`} onClose={() => { if (!submitting) dismiss(onClose); }} drawer panelClassName={`${surface.panel} ${closing ? surface.closing : ""}`}>
    <form id={`defect-form-${item.id}`} className={surface.form} ref={(element) => { panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing || submitting; }} onSubmit={submit} data-testid="inline-defect-composer">
      <div className={surface.body}>
        <section className={surface.section}>
          <div className={surface.grid}>
            <Field label={t("inlineDefect.title")} wide><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label={t("inlineDefect.severity")}><AnimatedSelect label={t("inlineDefect.severity")} value={severity} onChange={(value) => setSeverity(value as Defect["severity"])} options={[{ value: "critical", label: t("severity.critical") }, { value: "high", label: t("severity.major") }, { value: "medium", label: t("severity.minor") }, { value: "low", label: t("severity.low") }]} /></Field>
            <Field label={t("inlineDefect.priority")}><AnimatedSelect label={t("inlineDefect.priority")} value={priority} onChange={(value) => setPriority(value as Defect["priority"])} options={[{ value: "critical", label: t("inlineDefect.priorityUrgent") }, { value: "high", label: t("priority.high") }, { value: "medium", label: t("priority.medium") }, { value: "low", label: t("priority.low") }]} /></Field>
            <Field label={t("inlineDefect.category")} wide><AnimatedSelect label={t("inlineDefect.category")} value={component} onChange={setComponent} options={componentChoices} /></Field>
            <Field label={copy.routingLabel} wide><AnimatedSelect label={copy.routingLabel} value={integrationChoice} onChange={(value) => setIntegrationChoice(value as DefectIntegrationChoice)} options={routeOptions} disabled={offline || youTrackStatus !== "ready"} />
              {!offline && <details className={surface.hint}><summary>{locale === "ru" ? "Куда отправится дефект" : "Where the defect is sent"}</summary><p>{copy.routingHint}</p></details>}{!routing.resolved && <small className={shared.fieldValidation} role="status">{routingMessage}</small>}</Field>
            <div className={`${surface.field} ${surface.wide}`}><span>{locale === "ru" ? "Ответственный" : "Assignee"}</span><ResponsiblePicker workspaceId={workspaceId} value={assigneeIdentityId} onChange={setAssignee} offline={offline} disabled={submitting} /></div>
            <NarrativeField label={t("inlineDefect.description")} value={description} onChange={setDescription} disabled={submitting} />
          </div>
        </section>
        <section className={surface.section}>
          <div className={surface.evidenceHeading}><strong>{t("inlineDefect.reproSteps")}</strong><span>{t("inlineDefect.runSnapshotHint")}</span></div>
          <textarea className={surface.textarea} aria-label={t("inlineDefect.reproSteps")} required value={repro} onChange={(event) => setRepro(event.target.value)} />
          <div className={styles.snapshot}><RefreshCw size={14} /><span><strong>{t("inlineDefect.runSnapshot")}</strong><small>{t("inlineDefect.linkStep")} {step.order}</small></span></div>
        </section>
        <section className={surface.section}>
          <div className={surface.evidenceHeading}><strong>{t("inlineDefect.evidence")}</strong><span>{t("inlineDefect.fileTypes")}</span></div>
          <label className={surface.upload} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.querySelector("input")?.click(); } }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(current => appendDefectFiles(current, Array.from(event.dataTransfer.files))); }}><Paperclip size={15} /><span>{t("inlineDefect.chooseFiles")}</span><input tabIndex={-1} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf" onChange={(event) => { const added = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; setFiles(current => appendDefectFiles(current, added)); }} /></label>
          {files.length > 0 && <div className={surface.files}>{files.map((file) => <span key={`${file.name}-${file.lastModified}`}><Paperclip size={12} />{file.name}<button type="button" aria-label={`${t("inlineDefect.removeFile")} ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>)}</div>}
          <Field label={t("inlineDefect.deepLink")} wide><input value={link} onChange={(event) => setLink(event.target.value)} /></Field>
        </section>
        {error && <FormError message={error} />}
      </div>
      <div className={surface.footer}><span>{item.caseKey} · {t("inlineDefect.linkStep")} {step.order}</span><div><button type="button" className={shared.textButton} onClick={() => dismiss(onClose)} disabled={submitting}>{copy.cancel}</button><button type="submit" disabled={submitting || !routing.resolved}><Bug size={15} />{submitting ? t("inlineDefect.creating") : copy.create}</button></div></div>
    </form>
  </Modal>;
}
