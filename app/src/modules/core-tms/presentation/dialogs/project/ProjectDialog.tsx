import { FolderKanban, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment, Project } from "../../../../../core/tms/contracts/legacy-contract";
import { createProject } from "../../../application/projects/createProject";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function ProjectDialog({ workspaceId, offline, onClose, onCreated }: { workspaceId: string; offline: boolean; onClose: () => void; onCreated: (project: Project, environment: Environment) => void }) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [environmentName, setEnvironmentName] = useState("Local QA");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  function updateName(next: string) {
    setName(next);
    if (!key || key === name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()) setKey(next.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const result = await createProject({ workspaceId, name, key, description, environmentName, baseUrl, offline });
    if (!result.ok) {
      setError(result.reason === "project" ? "Check the project key and the TMS API response, then try again." : result.reason === "rollback" ? "The default environment and automatic project rollback both failed. Reload before retrying." : "The default environment could not be created. The partial project was rolled back.");
      setSubmitting(false);
      return;
    }
    onCreated(result.project, result.environment);
  }
  return <Modal title="Create project" subtitle="A project keeps its own repository, suites, environments, runs, and reports." onClose={onClose}>
    <form onSubmit={submit}>
      <div className={styles.formGrid}>
        <Field label="Project name" wide><input required autoFocus value={name} onChange={(event) => updateName(event.target.value)} placeholder="Mobile App" data-testid="project-name" /></Field>
        <Field label="Project key"><input required minLength={2} maxLength={10} value={key} onChange={(event) => setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} placeholder="MOBILE" /></Field>
        <Field label="Default environment"><input required value={environmentName} onChange={(event) => setEnvironmentName(event.target.value)} /></Field>
        <Field label="Description" wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What product or service does this project cover?" /></Field>
        <Field label="Base URL" wide><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></Field>
      </div>
      <div className={styles.snapshotNote}><FolderKanban size={18} /><span><strong>Ready to test immediately</strong><small>An empty repository and a default local environment are created together.</small></span></div>
      {error && <FormError message={error} />}
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || key.trim().length < 2}><Plus size={16} /> {submitting ? "Creating…" : "Create project"}</button></div>
    </form>
  </Modal>;
}
