"use client";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { CompanySso } from "../../domain/company-sso";
import type { SsoCopy } from "../copy/sso-copy";
import styles from "../screen/sso.module.css";

export function SsoServiceProvider({ config, copy }: { readonly config: CompanySso; readonly copy: SsoCopy }) {
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState("");
  return <section className={styles.section}><h2>{copy.sp}</h2><dl className={styles.values}>
    {[[copy.entity, config.entityId], [copy.acs, config.acsUrl], [copy.metadata, config.metadataUrl]].map(([label, value]) =>
      <div key={label}><dt>{label}</dt><dd><span>{value}</span><button aria-label={`${copy.copy} ${label}`} onClick={() => {
        void navigator.clipboard.writeText(value).then(() => { setCopied(label); setFeedback(`${copy.copied}: ${label}`); })
          .catch(() => { setCopied(""); setFeedback(copy.copyFailed); });
      }}>{copied === label ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button></dd></div>)}
  </dl><span className={styles.hint} role="status">{feedback}</span></section>;
}
