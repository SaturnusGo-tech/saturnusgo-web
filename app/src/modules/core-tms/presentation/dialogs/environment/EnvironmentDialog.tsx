import { Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment } from "../../../../../core/tms/contracts/legacy-contract";
import { createEnvironment } from "../../../application/environments/createEnvironment";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getEnvironmentDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
export function EnvironmentDialog({ projectId, offline, onClose, onCreated }: { projectId: string; offline: boolean; onClose: () => void; onCreated: (environment: Environment) => void }) {
  const { locale } = useTmsLocale(); const copy = getEnvironmentDialogCopy(locale);
  const [name, setName] = useState("Local QA"); const [key, setKey] = useState("local-qa"); const [baseUrl, setBaseUrl] = useState("http://localhost:3000"); const [description, setDescription] = useState<string>(copy.defaultDescription);
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError(false);
    try { onCreated(await createEnvironment({ projectId, name, key, baseUrl, description, offline })); }
    catch { setError(true); setSubmitting(false); }
  }
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose}><form onSubmit={submit}><div className={styles.formGrid}><Field label={copy.name} wide><input required value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label={copy.key}><input required value={key} onChange={(event) => setKey(event.target.value)} /></Field><Field label={copy.baseUrl}><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></Field><Field label={copy.description} wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field></div>{error && <FormError message={copy.error} />}<div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || !key.trim() || !baseUrl.trim()}><Plus size={16} /> {submitting ? copy.creating : copy.create}</button></div></form></Modal>;
}
