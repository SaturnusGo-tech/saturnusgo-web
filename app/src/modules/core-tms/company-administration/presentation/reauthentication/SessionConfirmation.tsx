"use client";

import { useCallback, useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

export function SessionConfirmation({ client, onConfirmed, onCancel, platform = false, submitLabel }: {
  readonly client: AdministrationPort; readonly onConfirmed: () => void | Promise<void>;
  readonly onCancel?: () => void; readonly platform?: boolean; readonly submitLabel?: string;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const command = useAdministrationCommand();
  const profile = useAdministrationResource(useCallback((signal) => client.profile(signal), [client]));
  return <form className={styles.confirmation} onSubmit={(event) => {
    event.preventDefault();
    const proof = { currentPassword: password, secondFactor: { kind: recovery ? "recovery" as const : "totp" as const, code } };
    void command.execute("confirm-session", async (_, signal) => {
      await client.reauthenticate(proof, signal); return true;
    }).then(async (saved) => { if (saved) { setPassword(""); setCode(""); await onConfirmed(); } });
  }}>
    <h3>{locale === "ru" ? "Подтвердите свою учётную запись" : "Confirm your own account"}</h3>
    <p className={styles.hint}>{platform
      ? (locale === "ru" ? "Введите свой пароль от Sandbox и код своего аутентификатора. Временный пароль сотрудника здесь не используется." : "Enter your Sandbox password and your authenticator code. The employee’s temporary password is not used here.")
      : (locale === "ru" ? "Введите пароль и код своей учётной записи." : "Enter your own account password and authenticator code.")}</p>
    {profile.value && <p className={styles.confirmingIdentity}>{profile.value.name} · <strong>{profile.value.login}</strong></p>}
    <div className={styles.confirmationFields}>
      <AccessField label={platform ? (locale === "ru" ? "Ваш пароль от Sandbox" : "Your Sandbox password") : (locale === "ru" ? "Ваш текущий пароль" : "Your current password")} type="password" autoComplete="current-password" required maxLength={128}
        revealLabel={locale === "ru" ? "Показать пароль" : "Show password"} disabled={command.pending}
        value={password} onChange={(event) => setPassword(event.target.value)} />
      <AccessField label={recovery ? copy.useRecovery : (locale === "ru" ? "Код вашего аутентификатора" : "Your authenticator code")} autoComplete="one-time-code" required maxLength={128} disabled={command.pending}
        hint={recovery ? undefined : (locale === "ru" ? "Если уже использовали этот код для входа, дождитесь следующего." : "If you already used this code to sign in, wait for the next one.")}
        value={code} onChange={(event) => setCode(event.target.value)} />
    </div>
    <label className={styles.checkLine}><input type="checkbox" disabled={command.pending} checked={recovery}
      onChange={(event) => setRecovery(event.target.checked)} />{copy.useRecovery}</label>
    {command.error && <p className={styles.error} role="alert">{command.error === "INVALID_CREDENTIALS" && platform
      ? (locale === "ru" ? "Пароль Sandbox не подошёл. Используйте свой текущий пароль, установленный после первого входа." : "The Sandbox password did not match. Use the current password you set after your first sign-in.")
      : administrationError(command.error, locale)}</p>}
    <div className={styles.actions}><button className={styles.primary} type="submit" disabled={command.pending}>{submitLabel ?? copy.confirm}</button>
      {onCancel && <button className={styles.button} type="button" disabled={command.pending} onClick={onCancel}>{copy.cancel}</button>}</div>
  </form>;
}
