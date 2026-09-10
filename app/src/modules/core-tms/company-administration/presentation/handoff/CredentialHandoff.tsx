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
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  function copyValue(value: string, field: string) {
    setCopyFailed(false);
    void navigator.clipboard.writeText(value).then(() => setCopied(field)).catch(() => { setCopied(null); setCopyFailed(true); });
  }
  return <div className={styles.handoff}>
    <header><h2>{copy.handoff}</h2><p className={styles.hint}>{copy.handoffHelp}</p></header>
    {hostname && <div className={styles.credential}><span className={styles.credentialLabel}>{copy.address}</span>
      <span className={styles.credentialAddress}>https://{hostname}</span></div>}
    {[{ field: "login", label: copy.login, value: login }, { field: "password", label: copy.temporaryPassword, value: password }].map((item) =>
      <div key={item.field} className={styles.credential}><span className={styles.credentialLabel}>{item.label}</span>
        <div className={styles.credentialValue}><code>{item.value}</code><button className={styles.button}
          aria-label={`${copy.copy}: ${item.label}`} title={`${copy.copy}: ${item.label}`} onClick={() => copyValue(item.value, item.field)}>
          {copied === item.field ? <Check size={16} /> : <Copy size={16} />}</button></div></div>)}
    {copied && <span className={styles.hint} role="status">{copy.copied}: {copied === "password" ? copy.temporaryPassword : copied === "login" ? copy.login : copy.handoff}</span>}
    {copyFailed && <p className={styles.error} role="alert">{locale === "ru" ? "Не удалось скопировать. Выделите нужное значение и скопируйте вручную." : "Could not copy. Select the value and copy it manually."}</p>}
    <div className={styles.actions}>
      <button className={styles.button} onClick={() => {
        const content = [hostname ? `https://${hostname}` : "", `${copy.login}: ${login}`, `${copy.temporaryPassword}: ${password}`].filter(Boolean).join("\n");
        copyValue(content, "all");
      }}><Copy size={16} />{locale === "ru" ? "Скопировать все данные" : "Copy all details"}</button>
      <button className={styles.primary} onClick={onDone}>{copy.done}</button>
    </div>
  </div>;
}
