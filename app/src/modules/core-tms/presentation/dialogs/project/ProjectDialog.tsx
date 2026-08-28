import { FolderKanban, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment, Project } from "../../../../../core/tms/contracts/legacy-contract";
import { createProject, updateProject } from "../../../application/projects/createProject";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getProjectDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
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
  const [error, setError] = useState<"project" | "environment" | null>(null);
  const [operationKey] = useState(() => crypto.randomUUID());
  function updateName(next: string) {
    setName(next);
    if (!key || key === name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()) setKey(next.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    if (project) {
      try {
        const result = await updateProject({ http, project, etag: projectEtag ?? null, name, key, description, offline, operationKey });
        onUpdated(result.data, result.etag);
      } catch {
        setError("project");
        setSubmitting(false);
      }
      return;
    }
    const result = await createProject({ http, workspaceId, name, key, description, environmentName, baseUrl, offline, locale, operationKey });
    if (!result.ok) {
      setError(result.reason);
      setSubmitting(false);
      return;
    }
    onCreated(result.project, result.environment);
  }
  return <Modal title={project ? copy.editTitle : copy.title} subtitle={copy.subtitle} onClose={onClose}>
    <form onSubmit={submit}>
      <div className={styles.formGrid}>
        <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => updateName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="project-name" /></Field>
        <Field label={copy.key}><input required disabled={Boolean(project)} minLength={2} maxLength={10} value={key} onChange={(event) => setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} placeholder={copy.keyPlaceholder} /></Field>
        {!project && <Field label={copy.environment}><input required value={environmentName} onChange={(event) => setEnvironmentName(event.target.value)} /></Field>}
        <Field label={copy.description} wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} /></Field>
        {!project && <Field label={copy.baseUrl} wide><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></Field>}
      </div>
      {!project && <div className={styles.snapshotNote}><FolderKanban size={18} /><span><strong>{copy.ready}</strong><small>{copy.readyHint}</small></span></div>}
      {error && <FormError message={error === "project" ? copy.projectError : copy.environmentError} />}
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || key.trim().length < 2}><Plus size={16} /> {submitting ? copy.creating : project ? copy.save : copy.create}</button></div>
    </form>
  </Modal>;
}
