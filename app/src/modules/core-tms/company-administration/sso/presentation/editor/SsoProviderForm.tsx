"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CompanySso, CompanySsoDraft } from "../../domain/company-sso";
import type { SsoCopy } from "../copy/sso-copy";
import styles from "../screen/sso.module.css";

export function SsoProviderForm({ config, copy, pending, save }: { readonly config: CompanySso; readonly copy: SsoCopy;
  readonly pending: boolean; readonly save: (draft: CompanySsoDraft) => Promise<void> }) {
  const [issuer, setIssuer] = useState(config.idpIssuer ?? "");
  const [entry, setEntry] = useState(config.entryPoint ?? "");
  const [attribute, setAttribute] = useState(config.subjectAttribute);
  const [certificate, setCertificate] = useState(config.certificates[0] ?? "");
  const [rotation, setRotation] = useState(config.certificates[1] ?? "");
  return <form className={styles.form} onSubmit={event => {
    event.preventDefault(); void save({ version: config.version, idpIssuer: issuer.trim(), entryPoint: entry.trim(),
      subjectAttribute: attribute.trim(), certificates: [certificate.trim(), rotation.trim()].filter(Boolean) });
  }}>
    <label>{copy.issuer}<input value={issuer} onChange={event => setIssuer(event.target.value)} required maxLength={2048} disabled={pending} /></label>
    <label>{copy.entry}<input type="url" pattern="https://.*" value={entry} onChange={event => setEntry(event.target.value)} required maxLength={2048} disabled={pending} /></label>
    <label>{copy.attribute}<input value={attribute} onChange={event => setAttribute(event.target.value)} required maxLength={256} disabled={pending} /></label>
    <label className={styles.full}>{copy.certificate}<textarea value={certificate} onChange={event => setCertificate(event.target.value)} required rows={4} maxLength={20000} spellCheck={false} disabled={pending} /></label>
    <details className={styles.rotation} open={!!config.certificates[1]}>
      <summary>{copy.rotationTitle}<ChevronDown className={styles.chevron} size={14} aria-hidden="true" /></summary>
      <label>{copy.rotation}<textarea value={rotation} onChange={event => setRotation(event.target.value)} rows={3} maxLength={20000} spellCheck={false} disabled={pending} /></label>
    </details>
    <div className={styles.formFooter}>
      <p className={styles.hint}>{config.configured ? copy.changeHint : copy.saveHint}</p>
      <button className={styles.primary} disabled={pending} type="submit">{copy.save}</button>
    </div>
  </form>;
}
