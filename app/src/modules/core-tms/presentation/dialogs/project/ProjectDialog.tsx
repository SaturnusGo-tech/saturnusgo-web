import { FolderKanban, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment, Project } from "../../../../../core/tms/contracts/legacy-contract";
import { createProject } from "../../../application/projects/createProject";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getProjectDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
export function ProjectDialog({ workspaceId, offline, onClose, onCreated }: { workspaceId: string; offline: boolean; onClose: () => void; onCreated: (project: Project, environment: Environment) => void }) {
  const { locale } = useTmsLocale();
  const copy = getProjectDialogCopy(locale);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [environmentName, setEnvironmentName] = useState("Local QA");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<"project" | "environment" | "rollback" | null>(null);
  function updateName(next: string) {
    setName(next);
    if (!key || key === name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()) setKey(next.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await createProject({ workspaceId, name, key, description, environmentName, baseUrl, offline, locale });
    if (!result.ok) {
      setError(result.reason);
      setSubmitting(false);
      return;
    }
    onCreated(result.project, result.environment);
  }
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose}>
    <form onSubmit={submit}>
      <div className={styles.formGrid}>
        <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => updateName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="project-name" /></Field>
        <Field label={copy.key}><input required minLength={2} maxLength={10} value={key} onChange={(event) => setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} placeholder={copy.keyPlaceholder} /></Field>
        <Field label={copy.environment}><input required value={environmentName} onChange={(event) => setEnvironmentName(event.target.value)} /></Field>
        <Field label={copy.description} wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} /></Field>
        <Field label={copy.baseUrl} wide><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></Field>
      </div>
      <div className={styles.snapshotNote}><FolderKanban size={18} /><span><strong>{copy.ready}</strong><small>{copy.readyHint}</small></span></div>
      {error && <FormError message={error === "project" ? copy.projectError : error === "rollback" ? copy.rollbackError : copy.environmentError} />}
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || key.trim().length < 2}><Plus size={16} /> {submitting ? copy.creating : copy.create}</button></div>
    </form>
  </Modal>;
}
