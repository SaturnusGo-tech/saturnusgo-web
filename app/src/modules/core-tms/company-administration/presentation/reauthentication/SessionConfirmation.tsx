"use client";

import { useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

export function SessionConfirmation({ client, onConfirmed }: {
  readonly client: AdministrationPort; readonly onConfirmed: () => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const command = useAdministrationCommand();
  return <form className={styles.confirmation} onSubmit={(event) => {
    event.preventDefault();
    const proof = { currentPassword: password, secondFactor: { kind: recovery ? "recovery" as const : "totp" as const, code } };
    void command.execute("confirm-session", async (_, signal) => {
      await client.reauthenticate(proof, signal); return true;
    }).then((saved) => { if (saved) { setPassword(""); setCode(""); onConfirmed(); } });
  }}>
    <h3>{locale === "ru" ? "Подтвердите вход" : "Confirm your identity"}</h3>
    <p className={styles.hint}>{locale === "ru" ? "Введите пароль и код, затем повторите действие. Открытая карточка сохранится." : "Enter your password and code, then retry the action. Your open page stays in place."}</p>
    <div className={styles.fields}>
      <AccessField label={copy.oldPassword} type="password" autoComplete="current-password" required maxLength={128}
        revealLabel={locale === "ru" ? "Показать пароль" : "Show password"} disabled={command.pending}
        value={password} onChange={(event) => setPassword(event.target.value)} />
      <AccessField label={copy.mfaCode} autoComplete="one-time-code" required maxLength={128} disabled={command.pending}
        value={code} onChange={(event) => setCode(event.target.value)} />
    </div>
    <label className={styles.actions}><input type="checkbox" disabled={command.pending} checked={recovery}
      onChange={(event) => setRecovery(event.target.checked)} />{copy.useRecovery}</label>
    {command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
    <div className={styles.actions}><button className={styles.primary} type="submit" disabled={command.pending}>{copy.confirm}</button></div>
  </form>;
}
