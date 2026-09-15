"use client";

import { MemberProfile } from "../member-profile/MemberProfile";
import { ProfileAvatarEditor } from "../avatar/ProfileAvatarEditor";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { MemberChange, MemberMutation } from "../../domain/administration";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import { ResourceState } from "../common/ResourceState";
import { CredentialHandoff } from "../handoff/CredentialHandoff";
import { MemberDetailsForm } from "../member-edit/MemberDetailsForm";
import { MemberSecurity } from "../member-edit/MemberSecurity";
import { SessionConfirmation } from "../reauthentication/SessionConfirmation";
import styles from "../layout/administration.module.css";
import editor from "../editor/editor.module.css";

export function MemberDetail({ id, client, session, onBack, onSaved, onBusy, requestedAction = null, onActionConsumed }: {
  readonly requestedAction?: MemberChange | "edit" | null; readonly onActionConsumed?: () => void;
  readonly id: string; readonly client: AdministrationPort; readonly session: SignedInCompanySession; readonly onBack: () => void; readonly onSaved: () => void; readonly onBusy: (value: boolean) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal) => client.member(id, signal), [client, id]));
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<MemberChange | null>(null);
  useEffect(() => {
    if (!requestedAction) return;
    if (requestedAction === "edit") setEditing(true); else setConfirmation(requestedAction);
    onActionConsumed?.();
  }, [requestedAction, onActionConsumed]);
  const [handoff, setHandoff] = useState<MemberMutation | null>(null);
  const [ownershipTransferred, setOwnershipTransferred] = useState(false);
  const command = useAdministrationCommand();
  const member = resource.value;
  useEffect(() => { onBusy(command.pending || !!handoff); }, [command.pending, handoff, onBusy]);
  useEffect(() => () => onBusy(false), [onBusy]);
  async function change(value: MemberChange) {
    if (!member || resource.refreshing || resource.error) return false;
    const result = await command.execute(JSON.stringify([id, member.version, value]), (key, signal) => client.changeMember(member, value, key, signal));
    if (!result) return false;
    onSaved();
    setConfirmation(null);
    if (value.kind === "ownership") { setOwnershipTransferred(true); return true; }
    if (result.temporaryPassword) setHandoff(result); else resource.refresh();
    return true;
  }
  if (handoff?.temporaryPassword) return <div className={editor.handoff}><CredentialHandoff login={handoff.member.login} password={handoff.temporaryPassword} hostname={window.location.hostname}
    onDone={() => { setHandoff(null); resource.refresh(); }} /></div>;
  const cannotEdit = command.pending || resource.refreshing || !!resource.error || member?.status === "revoked" || (!session.identity.owner && member?.role === "workspace_admin");
  const cannotManage = cannotEdit || member?.owner || session.identity.id === id;
  if (ownershipTransferred) return <section className={styles.section}>
    <h1>{locale === "ru" ? "Управление передано" : "Ownership transferred"}</h1>
    <p>{locale === "ru" ? "Главный администратор обновлён. Войдите снова, чтобы продолжить работу со своими текущими правами."
      : "The company owner has been updated. Sign in again to continue with your current permissions."}</p>
    <a className={styles.primary} href="/admin/">{locale === "ru" ? "Войти в Falcon" : "Sign in to Falcon"}</a>
  </section>;
  return <>
    {resource.loading || !member ? <div className={editor.handoff}>
      <button className={styles.back} onClick={onBack}>{copy.back}</button>
      <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} /></div> :
      <MemberProfile member={member} client={client} disabled={cannotEdit} canManage={!cannotManage} editing={editing}
        onEdit={() => setEditing(true)} onBack={onBack} onChange={setConfirmation} notice={<>
          {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
          {confirmation && <div className={styles.confirmation} role="alertdialog" aria-label={locale === "ru" ? "Подтверждение действия" : "Confirm action"}>
            <p>{confirmation.kind === "status" ? (confirmation.status === "revoked" ? copy.revoke : confirmation.status === "blocked" ? copy.block : copy.unblock) : copy.resetPassword}: {member.name}?</p>
            <div className={styles.actions}><button className={styles.primary} disabled={!!cannotManage} onClick={() => void change(confirmation)}>{copy.confirm}</button>
              <button className={styles.button} disabled={command.pending} onClick={() => setConfirmation(null)}>{copy.cancel}</button></div>
          </div>}
          {command.error === "REAUTHENTICATION_REQUIRED" ? <SessionConfirmation client={client} onConfirmed={command.clearError} />
            : command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
        </>}>
      <MemberDetailsForm key={member.version} member={member} disabled={cannotEdit} onChange={change} onBack={() => setEditing(false)}>
        <MemberSecurity member={member} disabled={!!cannotManage} allowAdmin={session.identity.owner} onChange={change} />
        <details className={editor.additional}><summary><ChevronRight size={16} />{locale === "ru" ? "Фотография" : "Photo"}</summary>
          <ProfileAvatarEditor identityId={id} name={member.name} hasAvatar={member.hasAvatar} version={member.version} client={client}
            disabled={cannotEdit} onSaved={() => { resource.refresh(); onSaved(); }} />
        </details>
      </MemberDetailsForm></MemberProfile>}
  </>;
}
