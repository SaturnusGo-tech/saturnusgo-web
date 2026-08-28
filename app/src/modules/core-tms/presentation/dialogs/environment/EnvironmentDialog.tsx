import { Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment } from "../../../../../core/tms/contracts/legacy-contract";
import {
  createEnvironment,
  updateEnvironment,
} from "../../../application/environments/createEnvironment";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getEnvironmentDialogCopy } from "./copy";
import styles from "../../../tms.module.css";

type Props = {
  projectId: string;
  environment?: Environment;
  environmentEtag?: string | null;
  offline: boolean;
  onClose: () => void;
  onCreated: (environment: Environment) => void;
  onUpdated: (environment: Environment, etag: string | null) => void;
};

export function EnvironmentDialog({
  projectId, environment, environmentEtag, offline, onClose, onCreated, onUpdated,
}: Props) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const copy = getEnvironmentDialogCopy(locale);
  const [name, setName] = useState(environment?.name ?? "");
  const [key, setKey] = useState(environment?.key ?? "");
  const [baseUrl, setBaseUrl] = useState(environment?.baseUrl ?? "");
  const [description, setDescription] = useState(environment?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [operationKey] = useState(() => crypto.randomUUID());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError(false);
    try {
      if (environment) {
        const result = await updateEnvironment({
          http, environment, etag: environmentEtag ?? null, name, key,
          baseUrl, description, offline, operationKey,
        });
        onUpdated(result.data, result.etag);
      } else {
        onCreated(await createEnvironment({
          http, projectId, name, key, baseUrl, description, offline, operationKey,
        }));
      }
    }
    catch { setError(true); setSubmitting(false); }
  }
  return <Modal title={environment ? copy.editTitle : copy.title} subtitle={copy.subtitle} onClose={onClose}><form onSubmit={submit}><div className={styles.formGrid}><Field label={copy.name} wide><input required value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label={copy.key}><input required value={key} onChange={(event) => setKey(event.target.value)} /></Field><Field label={copy.baseUrl}><input required type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></Field><Field label={copy.description} wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field></div>{error && <FormError message={copy.error} />}<div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || !key.trim() || !baseUrl.trim()}><Plus size={16} /> {submitting ? copy.creating : environment ? copy.save : copy.create}</button></div></form></Modal>;
}
