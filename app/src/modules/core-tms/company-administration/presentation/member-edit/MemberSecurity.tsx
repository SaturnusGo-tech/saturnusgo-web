"use client";

import { useState } from "react";
import type { CompanyMember, MemberChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RoleField } from "../permissions/RoleField";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function MemberSecurity({ member, disabled, allowAdmin, onChange }: {
  readonly member: CompanyMember; readonly disabled: boolean; readonly allowAdmin: boolean;
  readonly onChange: (change: MemberChange) => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [role, setRole] = useState(member.role);
  const [resetMfa, setResetMfa] = useState(false);
  const [confirmation, setConfirmation] = useState<{ label: string; change: MemberChange } | null>(null);
  return <section className={styles.section}><h2>{copy.access}</h2>
    <div className={styles.fields}><RoleField role={role} disabled={disabled} allowAdmin={allowAdmin} onChange={setRole} />
      <button className={styles.button} disabled={disabled || member.role === role} onClick={() => void onChange({ kind: "role", role })}>{copy.save}</button></div>
    <p className={styles.hint}>{copy.mfa}: {member.mfaEnabled ? copy.enabled : copy.notEnabled}</p>
    <div className={styles.actions}>
      <button className={styles.button} disabled={disabled} onClick={() => setConfirmation({ label: copy.resetPassword, change: { kind: "reset_password", resetMfa } })}>{copy.resetPassword}</button>
      {member.status === "blocked" ? <button className={styles.button} disabled={disabled} onClick={() => setConfirmation({ label: copy.unblock, change: { kind: "status", status: "active" } })}>{copy.unblock}</button>
        : <button className={styles.button} disabled={disabled} onClick={() => setConfirmation({ label: copy.block, change: { kind: "status", status: "blocked" } })}>{copy.block}</button>}
      <button className={`${styles.button} ${styles.danger}`} disabled={disabled} onClick={() => setConfirmation({ label: copy.revoke, change: { kind: "status", status: "revoked" } })}>{copy.revoke}</button>
      {allowAdmin && !member.owner && member.role === "workspace_admin" && member.status === "active" && member.mfaEnabled &&
        <button className={styles.button} disabled={disabled} onClick={() => setConfirmation({ label: copy.ownerTransfer, change: { kind: "ownership" } })}>{copy.ownerTransfer}</button>}
    </div>
    {member.mfaEnabled && <div className={styles.actions}><label><input type="checkbox" checked={resetMfa} disabled={disabled} onChange={(event) => setResetMfa(event.target.checked)} /> {copy.resetMfa}</label></div>}
    {confirmation && <div className={styles.confirmation}><p>{confirmation.label}: {member.name}?</p>
      {confirmation.change.kind === "ownership" && <p className={styles.hint}>{locale === "ru"
        ? "Он станет главным администратором компании. Ваш аккаунт сохранит роль администратора. Вам обоим потребуется войти заново."
        : "They will become the company owner. Your account stays an administrator. Both of you will need to sign in again."}</p>}
      <div className={styles.actions}><button className={styles.primary} disabled={disabled} onClick={() => void onChange(confirmation.change).then(() => setConfirmation(null))}>{copy.confirm}</button>
        <button className={styles.button} disabled={disabled} onClick={() => setConfirmation(null)}>{copy.cancel}</button></div>
    </div>}
  </section>;
}
