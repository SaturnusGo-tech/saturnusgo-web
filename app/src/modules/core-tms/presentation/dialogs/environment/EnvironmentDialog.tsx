import { Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment } from "../../../../../core/tms/contracts/legacy-contract";
import { createEnvironment } from "../../../application/environments/createEnvironment";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function EnvironmentDialog({ projectId, offline, onClose, onCreated }: { projectId: string; offline: boolean; onClose: () => void; onCreated: (environment: Environment) => void }) {
  const [name, setName] = useState("Local QA"); const [key, setKey] = useState("local-qa"); const [baseUrl, setBaseUrl] = useState("http://localhost:3000"); const [description, setDescription] = useState("Local test target");
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError("");
    try { onCreated(await createEnvironment({ projectId, name, key, baseUrl, description, offline })); }
    catch { setError("The environment was not saved. Check the key, URL, and TMS API response."); setSubmitting(false); }
  }
  return <Modal title="New environment" subtitle="Store a reusable target for manual runs." onClose={onClose}><form onSubmit={submit}><div className={styles.formGrid}><Field label="Name" wide><input required value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Key"><input required value={key} onChange={(event) => setKey(event.target.value)} /></Field><Field label="Base URL"><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></Field><Field label="Description" wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field></div>{error && <FormError message={error} />}<div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || !key.trim() || !baseUrl.trim()}><Plus size={16} /> {submitting ? "Creating…" : "Create environment"}</button></div></form></Modal>;
}
