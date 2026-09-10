"use client";

import { useState } from "react";
import type { AccessCopy } from "../copy/access-copy";
import styles from "../screen/access.module.css";

export function RecoveryCodes({ copy, codes, onContinue }: {
  readonly copy: AccessCopy; readonly codes: readonly string[]; readonly onContinue: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  return <>
    <h1>{copy.codesTitle}</h1><p className={styles.lead}>{copy.codesBody}</p>
    <ul className={styles.codes}>{codes.map((code) => <li key={code}><code>{code}</code></li>)}</ul>
    <button className={styles.linkButton} onClick={() => {
      void navigator.clipboard.writeText(codes.join("\n")).then(() => setCopied(true)).catch(() => setCopied(false));
    }}>{copied ? copy.copied : copy.copy}</button>
    <label className={styles.check}><input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />{copy.savedCodes}</label>
    <button className={styles.primary} disabled={!saved} onClick={onContinue}>{copy.continue}</button>
  </>;
}
