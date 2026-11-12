"use client";

import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { Button, Checkbox } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import type { Profile } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import passwordStyles from "./profile-password.module.css";

type Props = { readonly profile: Profile; readonly client: AdministrationPort; readonly onSaved: () => void; readonly onPendingChange?: (pending: boolean) => void };

export function ProfilePasswordForm({ profile, client, onSaved, onPendingChange }: Props) {
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
  const pendingNotice = useRef<(() => void) | null>(null);
  const releasePending = useCallback(() => { const release = pendingNotice.current; pendingNotice.current = null; release?.(); }, []);
  useEffect(() => releasePending, [releasePending]);
  const reveal = locale === "ru" ? "Показать пароль" : "Show password";
  return <form className={passwordStyles.form} aria-busy={command.pending} onSubmit={(event) => {
    event.preventDefault(); setSaved(false);
    if (newPassword !== confirmation) { setMismatch(true); return; }
    setMismatch(false);
    const payload = { currentPassword, newPassword, ...(profile.mfaEnabled ? { secondFactor: { kind: recovery ? "recovery" as const : "totp" as const, code } } : {}) };
    void command.execute("profile-password", async (_, signal) => {
      pendingNotice.current = () => onPendingChange?.(false);
      try { onPendingChange?.(true); await client.password(payload, signal); return true; }
      finally { releasePending(); }
    }).then((result) => {
      if (result) { setCurrent(""); setNew(""); setConfirmation(""); setCode(""); setSaved(true); onSaved(); }
    });
  }}>
    <div className={passwordStyles.fields}>
      <AccessField label={copy.oldPassword} required type="password" autoComplete="current-password" revealLabel={reveal}
        disabled={command.pending} value={currentPassword} onChange={(event) => setCurrent(event.target.value)} />
      <AccessField label={copy.newPassword} required type="password" autoComplete="new-password" minLength={12} maxLength={128} revealLabel={reveal}
        hint={locale === "ru" ? "Не менее 12 символов." : "At least 12 characters."}
        disabled={command.pending} value={newPassword} onChange={(event) => setNew(event.target.value)} />
      <AccessField label={copy.repeatPassword} required type="password" autoComplete="new-password" minLength={12} maxLength={128} revealLabel={reveal}
        disabled={command.pending} value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setMismatch(false); }} />
      {profile.mfaEnabled && <><AccessField label={copy.mfaCode} required autoComplete="one-time-code" disabled={command.pending}
        value={code} onChange={(event) => setCode(event.target.value)} maxLength={64} />
        <Checkbox isSelected={recovery} onValueChange={setRecovery} isDisabled={command.pending}
          classNames={{ base: passwordStyles.recovery, wrapper: passwordStyles.recoveryBox, icon: passwordStyles.recoveryIcon, label: passwordStyles.recoveryLabel }}>
          {copy.useRecovery}
        </Checkbox></>}
    </div>
    {mismatch && <p className={passwordStyles.error} role="alert">{locale === "ru" ? "Пароли не совпадают." : "Passwords do not match."}</p>}
    <ErrorToast message={command.error ? administrationError(command.error, locale) : null} />
    {saved && <p className={passwordStyles.success} role="status">{copy.passwordSaved}</p>}
    <div className={passwordStyles.actions}><Button type="submit" radius="full" className={passwordStyles.save}
      isDisabled={command.pending} isLoading={command.pending} spinner={<LoadingOrb/>}>{copy.updatePassword}</Button></div>
  </form>;
}
