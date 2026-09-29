import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Environment } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { readEnvironmentForEdit } from "../../../../application/environments/readEnvironmentForEdit";
import { createEnvironment, updateEnvironment } from "../../../../application/environments/createEnvironment";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { getEnvironmentDialogCopy } from "../../../dialogs/environment/copy";
import css from "../environments.module.css";

type Props = { projectId: string; environment?: Environment; offline: boolean; onClose(): void; onSaved(environment: Environment): void; onBusy(busy: boolean): void };
export function EnvironmentEditor({ projectId, environment, offline, onClose, onSaved, onBusy }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const http = useTmsHttpClient(); const { locale } = useTmsLocale(); const copy = getEnvironmentDialogCopy(locale);
  const [draft, setDraft] = useState({ name: environment?.name ?? "", key: environment?.key ?? "", baseUrl: environment?.baseUrl ?? "", description: environment?.description ?? "" });
  const [resource, setResource] = useState<{ data: Environment; etag: string | null } | null>(offline && environment ? { data: environment, etag: null } : null);
  const [loading, setLoading] = useState(Boolean(environment && !offline));
  const [pending, setPending] = useState(false); const [error, setError] = useState(false);
  const [operationKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (!environment || offline) return;
    let current = true;
    void readEnvironmentForEdit(http, environment.id).then(result => {
      if (!current) return;
      setResource(result); setDraft({ name: result.data.name, key: result.data.key, baseUrl: result.data.baseUrl, description: result.data.description ?? "" });
    }).catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [environment?.id, http, offline]);
  useEffect(() => { if (!loading) formRef.current?.querySelector("input")?.focus({ preventScroll: true }); }, [loading]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending || loading || (environment && !resource)) return;
    setPending(true); onBusy(true); setError(false);
    try {
      const result = environment && resource
        ? (await updateEnvironment({ http, environment: resource.data, etag: resource.etag, ...draft, offline, operationKey })).data
        : await createEnvironment({ http, projectId, ...draft, offline, operationKey });
      onSaved(result);
    } catch { setError(true); }
    finally { setPending(false); onBusy(false); }
  }
  const field = (key: keyof typeof draft, label: string, placeholder: string, type = "text") => <label>
    <span className={css.srOnly}>{label}</span><input aria-label={label} value={draft[key]} placeholder={placeholder} type={type}
      required={key !== "description"} disabled={loading || pending} autoCapitalize={key === "key" ? "characters" : "none"}
      onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} />
  </label>;
  return <form ref={formRef} className={css.editor} onSubmit={submit} aria-label={environment ? copy.editTitle : copy.title} aria-busy={pending || loading}>
    <span className={css.editorCaption}>{loading ? (locale === "ru" ? "Загрузка…" : "Loading…") : environment ? copy.editTitle : copy.title}</span>
    <div className={css.editorFields}>{field("name", copy.name, copy.namePlaceholder)}{field("key", copy.key, "STAGING")}{field("baseUrl", copy.baseUrl, "https://staging.example.com", "url")}</div>
    <div className={css.editorBottom}><label><span>{copy.description}</span><input value={draft.description} disabled={loading || pending}
      placeholder={copy.descriptionPlaceholder} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} /></label>
      <div className={css.actions}><button type="button" onClick={onClose} disabled={pending}>{copy.cancel}</button>
        <button className={css.save} disabled={loading || pending || Boolean(environment && !resource) || !draft.name.trim() || !draft.key.trim() || !draft.baseUrl.trim()}>
          {pending ? copy.creating : locale === "ru" ? "Сохранить" : "Save"}</button></div></div>
    {error && <p role="alert" className={css.error}>{copy.error}</p>}
  </form>;
}
