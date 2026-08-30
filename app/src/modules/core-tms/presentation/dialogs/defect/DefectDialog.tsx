import { Bug, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useState } from "react";
import type { FormEvent } from "react";
import type {
  Defect,
  RunItem,
  TestRunSummary,
} from "../../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../../application/defects/createDefect";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { inferDefectIntegrationTarget } from "../../../defects/model/integration-target";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { getDefectDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
import surface from "../drawer-surfaces.module.css";

type DefectDialogProps = {
  projectId: string;
  run: TestRunSummary | null;
  item: RunItem | null;
  components: string[];
  offline: boolean;
  onClose: () => void;
  onCreated: (defect: Defect) => void;
};

export function DefectDialog({
  projectId,
  run,
  item,
  components,
  offline,
  onClose,
  onCreated,
}: DefectDialogProps) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale } = useTmsLocale();
  const copy = getDefectDialogCopy(locale);
  const attempt =
    item?.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ??
    item?.attempts[0];
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
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [reproducibility, setReproducibility] = useState("Always");
  const [component, setComponent] = useState(componentOptions[0] ?? fallbackComponent);
  const [integrationTarget, setIntegrationTarget] = useState<Defect["integrationTarget"]>(() =>
    inferDefectIntegrationTarget(item?.snapshot.tags ?? [], item?.snapshot.component ?? ""),
  );
  const [filesRef] = useAutoAnimate<HTMLDivElement>({ duration: 160 });
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [operationKey] = useState(() => crypto.randomUUID());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    const payload: Omit<Defect,
      "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue"> = {
      projectId,
      title,
      description,
      severity,
      priority: severity,
      status: "open",
      reproducibility,
      assigneeIdentityId: null,
      component,
      integrationTarget,
      labels: ["manual-run", run?.type ?? "reported"],
      runId: run?.id ?? null,
      runItemId: item?.id ?? null,
      stepId: failedStep?.id ?? null,
      expectedResult: failedStep?.expectedResult ?? "",
      actualResult: actual,
    };
    try {
      onCreated(
        await createDefect({ http, attachments, projectId, payload, files, operationKey, link, offline, locale }),
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
      drawer
    >
      <form onSubmit={submit} className={`${styles.drawerForm} ${styles.productionDrawerForm} ${surface.form}`}>
        <div className={`${styles.drawerBody} ${surface.body}`}>
          <section className={`${styles.drawerSection} ${surface.section}`}><div className={`${styles.formGrid} ${surface.grid}`}>
          <Field label={copy.summary} wide>
            <input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} data-testid="defect-title" />
          </Field>
          <div className={`${styles.formField} ${styles.formFieldWide}`}><span>{copy.component}</span>
            <AnimatedSelect label={copy.component} value={component} onChange={setComponent} options={localizedComponentOptions} />
          </div>
          <div className={`${styles.formField} ${styles.formFieldWide}`}><span>{copy.youTrackTarget}</span>
            <AnimatedSelect label={copy.youTrackTarget} value={integrationTarget ?? "none"}
              onChange={(value) => setIntegrationTarget(value === "none" ? null : value as Exclude<Defect["integrationTarget"], null>)}
              options={[{ value: "none", label: copy.tmsOnly },
                { value: "android", label: copy.youTrackAndroid },
                { value: "ios", label: copy.youTrackIos },
                { value: "backend", label: copy.youTrackBackend }]} />
          </div>
          <div className={styles.formField}><span>{copy.severity}</span>
            <AnimatedSelect label={copy.severity} value={severity} onChange={(value) => setSeverity(value as Defect["severity"])} options={[
              { value: "low", label: copy.low }, { value: "medium", label: copy.medium },
              { value: "high", label: copy.high }, { value: "critical", label: copy.critical },
            ]} />
          </div>
          <div className={styles.formField}><span>{copy.reproducibility}</span>
            <AnimatedSelect label={copy.reproducibility} value={reproducibility} onChange={setReproducibility} options={[
              { value: "Always", label: copy.always }, { value: "Sometimes", label: copy.sometimes },
              { value: "Once", label: copy.once },
            ]} />
          </div>
          <Field label={copy.description} wide>
            <textarea className={`${styles.drawerTextarea} ${surface.textarea}`} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label={copy.expected} wide>
            <textarea className={`${styles.drawerTextarea} ${surface.textarea}`} value={failedStep?.expectedResult ?? ""} readOnly />
          </Field>
          <Field label={copy.actual} wide>
            <textarea className={`${styles.drawerTextarea} ${surface.textarea}`} required value={actual} onChange={(event) => setActual(event.target.value)} />
          </Field>
          <Field label={copy.deepLink} wide>
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder={copy.linkPlaceholder} />
          </Field>
        </div></section>
        <section className={`${styles.drawerSection} ${surface.section}`}><div className={styles.drawerSectionHeading}><strong>{copy.addEvidence}</strong><span>{copy.evidenceFormats}</span></div><div className={styles.compactUpload}>
          <label role="button" tabIndex={0} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.querySelector("input")?.click(); }
          }}>
            <ImageIcon size={18} />
            <span>{copy.addEvidence}</span>
            <input tabIndex={-1} type="file" multiple accept="image/*,video/*,.log,.txt,.pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
          </label>
        </div><div ref={filesRef} className={styles.compactFileList}>{files.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}><Paperclip size={13} />{file.name}<button type="button" aria-label={`${copy.removeFile} ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>
          ))}</div></section>
          {error && <FormError message={copy.error} />}
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button>
          <button className={styles.primaryButton} data-testid="create-defect" disabled={submitting}>
            <Bug size={16} /> {submitting ? copy.creating : copy.create}
          </button>
        </div>
      </form>
    </Modal>
  );
}
