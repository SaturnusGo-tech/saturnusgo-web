import { NarrativeField } from "../../cases/inspector/markdown/plain/NarrativeField";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { Bug, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState, type FormEvent } from "react";
import type { Defect, RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../../application/defects/createDefect";
import { describeDefectCreateError } from "../../../application/defects/describeDefectCreateError";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { defectClientLabels, inferLegacyDefectIntegrationTarget, resolveDefectIntegrationChoice, type DefectIntegrationChoice } from "../../../defects/model/integration-target";
import { useYouTrackRouteOptions } from "../../../defects/presentation/use-youtrack-route-options";
import { defectRouteChoices } from "../../../defects/presentation/defect-route-choices";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { getDefectDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
import { appendDefectFiles } from "../defect-layout/files";
import surface from "../defect-layout/defect-form.module.css";
import { useDrawerDismiss } from "../../common/drawer/useDrawerDismiss";
type DefectDialogProps = {
  workspaceId: string; projectId: string; run: TestRunSummary | null; item: RunItem | null; components: string[];
  offline: boolean; onClose: () => void; onCreated: (defect: Defect) => void;
};
export function DefectDialog({ workspaceId, projectId, run, item, components, offline, onClose,
  onCreated }: DefectDialogProps) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale } = useTmsLocale();
  const copy = getDefectDialogCopy(locale);
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const youTrack = useYouTrackRouteOptions(workspaceId, locale);
  const occurrence = run && item ? { run, item } : null;
  const attempt = item?.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ?? item?.attempts[0];
  const failedStep = item
    ? executableSteps(item.snapshot, locale).find(
        (step) =>
          attempt?.stepResults.find((result) => result.stepId === step.id)
            ?.status === "failed",
      )
    : undefined;
  const fallbackComponent = locale === "ru" ? "Основной продукт" : "Core product";
  const projectComponents = Array.from(new Set([
    item?.snapshot.component,
    ...components,
  ].map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
  const componentOptions = projectComponents.length > 0 ? projectComponents : [fallbackComponent];
  const localizedComponentOptions = componentOptions.map((value) => ({
    value,
    label: localizedComponentLabel(locale, value),
  }));
  const [title, setTitle] = useState(
    item
      ? `${item.snapshot.title} ${copy.failsOn} ${run?.environment.name ?? copy.testEnvironment}`
      : "",
  );
  const [description, setDescription] = useState(item?.snapshot.description ?? "");
  const [actual, setActual] = useState(
    attempt?.actualResult ?? copy.defaultActual,
  );
  const [assigneeIdentityId, setAssignee] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [reproducibility, setReproducibility] = useState("Always");
  const [component, setComponent] = useState(componentOptions[0] ?? fallbackComponent);
  const [integrationChoice, setIntegrationChoice] = useState<DefectIntegrationChoice>("");
  const { configurationVersion, enabled, options: youTrackOptions, status: youTrackStatus } = youTrack;
  useEffect(() => {
    if (configurationVersion !== 1 || !enabled || integrationChoice) return;
    const suggested = inferLegacyDefectIntegrationTarget(
      item?.snapshot.tags ?? [], item?.snapshot.component ?? component,
    );
    if (suggested && youTrackOptions.some((option) => option.value === suggested)) setIntegrationChoice(suggested);
  }, [component, configurationVersion, enabled, integrationChoice, item, youTrackOptions]);
  const automaticRouting = offline || (youTrackStatus === "ready" && (configurationVersion === 2 || !enabled));
  const routing = resolveDefectIntegrationChoice(integrationChoice, automaticRouting);
  const routeOptions = offline ? [{ value: "", label: copy.projectIntegrations }]
    : youTrackStatus === "loading" ? [{ value: "", label: copy.youTrackLoading }]
    : youTrackStatus === "error" ? [{ value: "", label: copy.youTrackUnavailable }]
    : defectRouteChoices(youTrack, copy);
  const routingMessage = youTrackStatus === "error" ? copy.youTrackUnavailable
    : youTrackStatus === "loading" ? copy.youTrackLoading : copy.youTrackRequired;
  const [filesRef] = useAutoAnimate<HTMLDivElement>({ duration: 160 });
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [operationKey] = useState(() => crypto.randomUUID());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!routing.resolved) { setError(copy.youTrackRequired); return; }
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect,
      "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue"> = {
      projectId,
      title,
      description,
      severity,
      priority: severity,
      status: "open",
      reproducibility,
      assigneeIdentityId,
      component,
      integrationTarget: routing.target,
      labels: defectClientLabels(occurrence !== null),
      runId: occurrence?.run.id ?? null,
      runItemId: occurrence?.item.id ?? null,
      stepId: failedStep?.id ?? null,
      expectedResult: failedStep?.expectedResult ?? "",
      actualResult: actual,
    };
    try {
      const created = await createDefect({ http, attachments, projectId, payload, files, operationKey, link, offline, locale });
      dismiss(() => onCreated(created));
    } catch (caught) {
      setError(describeDefectCreateError(caught, copy.error, locale));
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
      onClose={() => { if (!submitting) dismiss(onClose); }}
      wide
      drawer panelClassName={`${surface.panel} ${closing ? surface.closing : ""}`}
    >
      <form onSubmit={submit} className={surface.form} ref={(element) => { panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing || submitting; }}>
        <div className={surface.body}>
          <section className={surface.section}><div className={surface.grid}>
          <Field label={copy.summary} wide>
            <input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} data-testid="defect-title" />
          </Field>
          <div className={`${surface.field} ${surface.wide}`}><span>{copy.component}</span>
            <AnimatedSelect label={copy.component} value={component} onChange={setComponent} options={localizedComponentOptions} />
          </div>
          <div className={`${surface.field} ${surface.wide}`}><span>{copy.routingLabel}</span>
            <AnimatedSelect label={copy.routingLabel} value={integrationChoice}
              onChange={(value) => setIntegrationChoice(value as DefectIntegrationChoice)}
              options={routeOptions} disabled={offline || youTrackStatus !== "ready"} />
            {!offline && <details className={surface.hint}><summary>{locale === "ru" ? "Куда отправится дефект" : "Where the defect is sent"}</summary><p>{copy.routingHint}</p></details>}
            {!routing.resolved && <small className={styles.fieldValidation} role="status">{routingMessage}</small>}
          </div>
          <div className={surface.field}><span>{copy.severity}</span>
            <AnimatedSelect label={copy.severity} value={severity} onChange={(value) => setSeverity(value as Defect["severity"])} options={[
              { value: "low", label: copy.low }, { value: "medium", label: copy.medium },
              { value: "high", label: copy.high }, { value: "critical", label: copy.critical },
            ]} />
          </div>
          <div className={surface.field}><span>{copy.reproducibility}</span>
            <AnimatedSelect label={copy.reproducibility} value={reproducibility} onChange={setReproducibility} options={[
              { value: "Always", label: copy.always }, { value: "Sometimes", label: copy.sometimes },
              { value: "Once", label: copy.once },
            ]} />
          </div>
          <div className={`${surface.field} ${surface.wide}`}><span>{locale === "ru" ? "Ответственный" : "Assignee"}</span><ResponsiblePicker workspaceId={workspaceId} value={assigneeIdentityId} onChange={setAssignee} offline={offline} disabled={submitting} /></div>
          <NarrativeField label={copy.description} value={description} onChange={setDescription} disabled={submitting} />
          <NarrativeField label={copy.expected} value={failedStep?.expectedResult ?? ""} />
          <Field label={copy.actual} wide>
            <textarea className={surface.textarea} required value={actual} onChange={(event) => setActual(event.target.value)} />
          </Field>
          <Field label={copy.deepLink} wide>
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder={copy.linkPlaceholder} />
          </Field>
        </div></section>
        <section className={surface.section}><div className={surface.evidenceHeading}><strong>{copy.addEvidence}</strong><span>{copy.evidenceFormats}</span></div><div>
          <label className={surface.upload} role="button" tabIndex={0} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.querySelector("input")?.click(); }
          }}>
            <ImageIcon size={18} />
            <span>{copy.addEvidence}</span>
            <input tabIndex={-1} type="file" multiple accept="image/*,video/*,.log,.txt,.pdf" onChange={(event) => { const added = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; setFiles(current => appendDefectFiles(current, added)); }} />
          </label>
        </div><div ref={filesRef} className={surface.files}>{files.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}><Paperclip size={13} />{file.name}<button type="button" aria-label={`${copy.removeFile} ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>
          ))}</div></section>
          {error && <FormError message={error} />}
        </div>
        <div className={surface.footer}>
          <button type="button" className={styles.textButton} onClick={() => dismiss(onClose)} disabled={submitting}>{copy.cancel}</button>
          <button type="submit" data-testid="create-defect" disabled={submitting || !routing.resolved}>
            <Bug size={16} /> {submitting ? copy.creating : copy.create}
          </button>
        </div>
      </form>
    </Modal>
  );
}
