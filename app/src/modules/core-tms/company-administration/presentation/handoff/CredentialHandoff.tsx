"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function CredentialHandoff({ login, password, hostname, onDone }: {
  readonly login: string; readonly password: string; readonly hostname: string | null; readonly onDone: () => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [copied, setCopied] = useState(false);
  return <div className={styles.sections}>
    <header className={styles.heading}><div><h1>{copy.handoff}</h1><p>{copy.handoffHelp}</p></div></header>
    <dl className={styles.details}>
      {hostname && <><dt>{copy.address}</dt><dd>https://{hostname}</dd></>}
      <dt>{copy.login}</dt><dd>{login}</dd>
      <dt>{copy.temporaryPassword}</dt><dd className={styles.secret}>{password}</dd>
    </dl>
    <div className={styles.actions}>
      <button className={styles.button} onClick={() => {
        const content = [hostname ? `https://${hostname}` : "", `${copy.login}: ${login}`, `${copy.temporaryPassword}: ${password}`].filter(Boolean).join("\n");
        void navigator.clipboard.writeText(content).then(() => setCopied(true)).catch(() => setCopied(false));
      }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? copy.copied : copy.copy}</button>
      <button className={styles.primary} onClick={onDone}>{copy.done}</button>
    </div>
  </div>;
}
