import { Check, Globe2, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Environment } from "../../../../../core/tms/contracts/legacy-contract";
import {
  createEnvironment,
  updateEnvironment,
} from "../../../application/environments/createEnvironment";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getEnvironmentDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
import css from "./environment.module.css";

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
  return <Modal title={environment ? copy.editTitle : copy.title} subtitle={copy.subtitle}
    panelClassName={css.dialog} onClose={onClose}>
    <form className={css.form} onSubmit={submit} aria-busy={submitting}>
      <div className={css.body}>
        <div className={css.identity}>
          <label className={css.field}><span>{copy.name}</span>
            <span className={css.inputShell} data-input-shell>
              <input required data-autofocus value={name} placeholder={copy.namePlaceholder}
                onChange={(event) => setName(event.target.value)} />
            </span>
          </label>
          <label className={css.field}><span>{copy.key}</span>
            <span className={css.inputShell} data-input-shell>
              <input required value={key} placeholder="STAGING" autoCapitalize="characters" spellCheck={false}
                onChange={(event) => setKey(event.target.value)} />
            </span>
          </label>
        </div>
        <label className={css.field}><span>{copy.baseUrl}</span>
          <span className={css.inputShell} data-input-shell>
            <Globe2 size={16} aria-hidden="true" />
            <input required type="url" value={baseUrl} placeholder="https://staging.example.com"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              onChange={(event) => setBaseUrl(event.target.value)} />
          </span>
        </label>
        <label className={css.field}><span>{copy.description}<small>{copy.optional}</small></span>
          <span className={css.inputShell} data-input-shell>
            <textarea value={description} rows={3} placeholder={copy.descriptionPlaceholder}
              onChange={(event) => setDescription(event.target.value)} />
          </span>
        </label>
        {error && <FormError message={copy.error} />}
      </div>
      <footer className={css.footer}>
        <button type="button" className={css.cancel} onClick={onClose}>{copy.cancel}</button>
        <button type="submit" className={styles.primaryButton}
          disabled={submitting || !name.trim() || !key.trim() || !baseUrl.trim()}>
          {environment ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {submitting ? copy.creating : environment ? copy.save : copy.create}
        </button>
      </footer>
    </form>
  </Modal>;
}
