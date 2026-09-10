"use client";

import { useState } from "react";
import type { Profile } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

export function ProfilePasswordForm({ profile, client, onSaved }: { readonly profile: Profile; readonly client: AdministrationPort; readonly onSaved: () => void }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [saved, setSaved] = useState(false);
  const command = useAdministrationCommand();
  const reveal = locale === "ru" ? "Показать пароль" : "Show password";
  return <form id="security" className={styles.section} onSubmit={(event) => {
    event.preventDefault(); setSaved(false);
    if (newPassword !== confirmation) { setMismatch(true); return; }
    setMismatch(false);
    const payload = { currentPassword, newPassword, ...(profile.mfaEnabled ? { secondFactor: { kind: recovery ? "recovery" as const : "totp" as const, code } } : {}) };
    void command.execute("profile-password", async (_, signal) => { await client.password(payload, signal); return true; }).then((result) => {
      if (result) { setCurrent(""); setNew(""); setConfirmation(""); setCode(""); setSaved(true); onSaved(); }
    });
  }}>
    <h2>{copy.updatePassword}</h2>
    <div className={styles.fields}>
      <AccessField label={copy.oldPassword} required type="password" autoComplete="current-password" revealLabel={reveal}
        disabled={command.pending} value={currentPassword} onChange={(event) => setCurrent(event.target.value)} />
      <div />
      <AccessField label={copy.newPassword} required type="password" autoComplete="new-password" minLength={12} maxLength={128} revealLabel={reveal}
        disabled={command.pending} value={newPassword} onChange={(event) => setNew(event.target.value)} />
      <AccessField label={copy.repeatPassword} required type="password" autoComplete="new-password" minLength={12} maxLength={128} revealLabel={reveal}
        disabled={command.pending} value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setMismatch(false); }} />
      {profile.mfaEnabled && <><AccessField label={copy.mfaCode} required autoComplete="one-time-code" disabled={command.pending}
        value={code} onChange={(event) => setCode(event.target.value)} maxLength={64} />
        <label className={styles.actions}><input type="checkbox" checked={recovery} onChange={(event) => setRecovery(event.target.checked)} />{copy.useRecovery}</label></>}
    </div>
    {mismatch && <p className={styles.error} role="alert">{locale === "ru" ? "Пароли не совпадают." : "Passwords do not match."}</p>}
    {command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
    {saved && <p className={styles.success} role="status">{copy.passwordSaved}</p>}
    <div className={styles.actions}><button type="submit" className={styles.button} disabled={command.pending}>{copy.updatePassword}</button></div>
  </form>;
}
