import { LoaderCircle, LockKeyhole, Plus, Server } from "lucide-react";
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
  const [environmentName, setEnvironmentName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  function updateName(next: string) {
    setName(next);
    if (!project && (!key || key === name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase())) setKey(next.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase());
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
  const modified = !project || name.trim() !== project.name || description.trim() !== (project.description ?? "");
  return <Modal title={project ? copy.editTitle : copy.title} onClose={onClose} panelClassName={styles.panel}>
    <form className={styles.form} onSubmit={submit} aria-busy={submitting || undefined}>
      <div className={styles.body}>
        <p className={styles.intro}>{project ? copy.editHint : copy.createHint}</p>
        <div className={project ? styles.editFields : styles.identityFields}>
          <label className={styles.field}><span>{copy.name}</span>
            <input required autoFocus data-autofocus disabled={submitting} value={name} onChange={(event) => updateName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="project-name" /></label>
          {!project && <label className={styles.field}><span>{copy.key}</span>
            <input required disabled={submitting} minLength={2} maxLength={10} value={key}
              onChange={(event) => setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} placeholder={copy.keyPlaceholder} aria-describedby="project-key-hint" />
          </label>}
        </div>
        {!project && <p id="project-key-hint" className={styles.hint}>{copy.newKeyHint}<code>{key || copy.keyPlaceholder}-TC-1</code></p>}
        <label className={styles.field}><span>{copy.description}<small>{copy.optional}</small></span>
          <textarea disabled={submitting} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} rows={3} /></label>
        {project ? <div className={styles.projectKey}>
          <LockKeyhole size={15} aria-hidden="true" /><span>{copy.key}<small>{copy.keyHint}</small></span><code>{project.key}</code>
        </div> : <section className={styles.environment} aria-labelledby="project-environment-title">
          <header><Server size={17} aria-hidden="true" /><div><h3 id="project-environment-title">{copy.environment}</h3><p>{copy.environmentHint}</p></div></header>
          <div className={styles.environmentFields}>
            <label className={styles.field}><span>{copy.environmentName}</span><input required disabled={submitting} value={environmentName} onChange={(event) => setEnvironmentName(event.target.value)} placeholder="Staging" /></label>
            <label className={styles.field}><span>{copy.baseUrl}</span><input required disabled={submitting} type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://staging.example.com" /></label>
          </div>
        </section>}
        {error && <FormError message={error} />}
      </div>
      <footer className={styles.actions}>
        <button type="button" onClick={onClose} disabled={submitting}>{copy.cancel}</button>
        <button className={styles.primary} disabled={submitting || !name.trim() || key.trim().length < 2 || (!project && (!environmentName.trim() || !baseUrl.trim())) || (!modified && !error)}>
          {submitting ? <LoaderCircle size={15} className={styles.spin} aria-hidden="true" /> : !project ? <Plus size={15} aria-hidden="true" /> : null}
          {submitting ? project ? copy.saving : copy.creating : project ? copy.save : copy.create}
        </button>
      </footer>
    </form>
  </Modal>;
}
