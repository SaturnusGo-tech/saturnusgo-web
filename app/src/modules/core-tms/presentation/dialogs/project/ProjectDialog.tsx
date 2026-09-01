import { ChevronDown, Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Environment, Project } from "../../../../../core/tms/contracts/legacy-contract";
import {
  formatTmsMutationFailure,
  toTmsMutationFailure,
} from "../../../../../core/tms/errors/mutation-failure";
import {
  resolvePendingOperation,
  type PendingOperation,
} from "../../../../../core/tms/idempotency/pending-operation";
import { createProject, updateProject } from "../../../application/projects/createProject";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getProjectDialogCopy } from "./copy";
import styles from "./projectDialog.module.css";
export function ProjectDialog({ workspaceId, project, projectEtag, offline, onClose, onCreated, onUpdated }: { workspaceId: string; project?: Project; projectEtag?: string | null; offline: boolean; onClose: () => void; onCreated: (project: Project, environment: Environment) => void; onUpdated: (project: Project, etag: string | null) => void }) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const copy = getProjectDialogCopy(locale);
  const [name, setName] = useState(project?.name ?? "");
  const [key, setKey] = useState(project?.key ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [additionalOpen, setAdditionalOpen] = useState(Boolean(project));
  const [environmentName, setEnvironmentName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  function updateName(next: string) {
    setName(next);
    if (!key || key === name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()) setKey(next.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const signature = JSON.stringify({
      projectId: project?.id ?? null,
      projectEtag: projectEtag ?? null,
      workspaceId,
      name: name.trim(),
      key: key.trim(),
      description: description.trim(),
      environmentName: environmentName.trim(),
      baseUrl: baseUrl.trim(),
    });
    operation.current = resolvePendingOperation(operation.current, signature);
    const operationKey = operation.current.key;
    if (project) {
      try {
        const result = await updateProject({ http, project, etag: projectEtag ?? null, name, key, description, offline, operationKey });
        onUpdated(result.data, result.etag);
      } catch (caught) {
        setError(formatTmsMutationFailure(toTmsMutationFailure(caught), copy.projectError));
        setSubmitting(false);
      }
      return;
    }
    const result = await createProject({ http, workspaceId, name, key, description, environmentName, baseUrl, offline, locale, operationKey });
    if (!result.ok) {
      const fallback = result.reason === "project" ? copy.projectError : copy.environmentError;
      setError(formatTmsMutationFailure(result.failure, fallback));
      setSubmitting(false);
      return;
    }
    onCreated(result.project, result.environment);
  }
  return <Modal title={project ? copy.editTitle : copy.title} subtitle={copy.subtitle} onClose={onClose} panelClassName={styles.panel}>
    <form className={styles.form} onSubmit={submit}>
      <section className={`${styles.section} ${styles.identitySection}`}>
        <header><span>1</span><div><strong>{copy.identity}</strong><small>{copy.identityHint}</small></div></header>
        <div className={styles.sectionBody}>
          <label className={styles.wide}><span>{copy.name}</span><input required autoFocus value={name} onChange={(event) => updateName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="project-name" /></label>
        </div>
      </section>
      <section className={`${styles.section} ${styles.setupSection}`}>
        <header><span>2</span><div><strong>{copy.setup}</strong><small>{copy.setupHint}</small></div></header>
        <div className={styles.sectionBody}>
          <label><span>{copy.key}</span><input required disabled={Boolean(project)} minLength={2} maxLength={10} value={key} onChange={(event) => setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} placeholder={copy.keyPlaceholder} /></label>
          {!project && <label><span>{copy.environment}</span><input required value={environmentName} onChange={(event) => setEnvironmentName(event.target.value)} /></label>}
          {!project && <label className={styles.wide}><span>{copy.baseUrl}</span><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://example.com" /></label>}
        </div>
      </section>
      <details className={styles.optional} open={additionalOpen} onToggle={(event) => setAdditionalOpen(event.currentTarget.open)}>
        <summary><span>3</span><div><strong>{copy.additional}</strong><small>{copy.additionalHint}</small></div><ChevronDown size={15} /></summary>
        <div className={styles.sectionBody}><label className={styles.wide}><span>{copy.description}</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} /></label></div>
      </details>
      {error && <FormError message={error} />}
      <div className={styles.actions}><button type="button" onClick={onClose}>{copy.cancel}</button><button className={styles.primary} disabled={submitting || !name.trim() || key.trim().length < 2}><Plus size={15} /> {submitting ? copy.creating : project ? copy.save : copy.create}</button></div>
    </form>
  </Modal>;
}
