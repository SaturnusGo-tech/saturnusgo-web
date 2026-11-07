"use client";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { CompanySso } from "../../domain/company-sso";
import type { SsoCopy } from "../copy/sso-copy";
import { SsoDisclosure } from "../screen/SsoDisclosure";
import styles from "../screen/sso.module.css";

export function SsoServiceProvider({ config, copy }: { readonly config: CompanySso; readonly copy: SsoCopy }) {
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState("");
  return <SsoDisclosure title={copy.sp} description={copy.spHint}>
    <dl className={styles.values}>
      {[[copy.entity, config.entityId], [copy.acs, config.acsUrl], [copy.metadata, config.metadataUrl]].map(([label, value]) =>
        <div key={label}>
          <dt>{label}</dt>
          <dd><code>{value}</code><button className={styles.iconButton} type="button" aria-label={`${copy.copy} ${label}`} onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(label);
              setFeedback(`${copy.copied} ${label}`);
            } catch {
              setCopied("");
              setFeedback(copy.copyFailed);
            }
          }}>{copied === label ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button></dd>
        </div>)}
    </dl>
    <p className={styles.clipboardStatus} role="status">{feedback}</p>
  </SsoDisclosure>;
}
