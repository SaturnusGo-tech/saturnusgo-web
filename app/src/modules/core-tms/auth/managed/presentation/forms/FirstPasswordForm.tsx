"use client";

import { useState } from "react";
import type { AccessCopy } from "../copy/access-copy";
import { AccessField } from "../fields/AccessField";
import styles from "../screen/access.module.css";

export function FirstPasswordForm({ copy, pending, onSubmit }: {
  readonly copy: AccessCopy; readonly pending: boolean; readonly onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mismatch, setMismatch] = useState(false);
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    if (password !== confirmation) { setMismatch(true); return; }
    setMismatch(false); void onSubmit(password).then(() => { setPassword(""); setConfirmation(""); });
  }}>
    <AccessField label={copy.newPassword} type="password" autoComplete="new-password" name="new-password" autoFocus
      revealLabel={copy.showPassword} required minLength={12} maxLength={128} disabled={pending}
      value={password} onChange={(event) => setPassword(event.target.value)} />
    <AccessField label={copy.confirmPassword} type="password" autoComplete="new-password" name="confirm-password"
      revealLabel={copy.showPassword} required minLength={12} maxLength={128} disabled={pending}
      value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setMismatch(false); }} />
    {mismatch && <p className={styles.error} role="alert">{copy.passwordMismatch}</p>}
    <span className={styles.company}>{copy.passwordHint}</span>
    <button type="submit" className={styles.primary} disabled={pending}>{copy.savePassword}</button>
  </form>;
}
