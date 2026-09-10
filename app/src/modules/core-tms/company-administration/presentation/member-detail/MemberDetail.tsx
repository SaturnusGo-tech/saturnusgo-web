"use client";

import { ProfileAvatarEditor } from "../avatar/ProfileAvatarEditor";
import { ArrowLeft } from "lucide-react";
import { useCallback, useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { MemberChange, MemberMutation } from "../../domain/administration";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import { CredentialHandoff } from "../handoff/CredentialHandoff";
import { MemberDetailsForm } from "../member-edit/MemberDetailsForm";
import { MemberSecurity } from "../member-edit/MemberSecurity";
import { SessionConfirmation } from "../reauthentication/SessionConfirmation";
import styles from "../layout/administration.module.css";

export function MemberDetail({ id, client, session, onBack }: {
  readonly id: string; readonly client: AdministrationPort; readonly session: SignedInCompanySession; readonly onBack: () => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal) => client.member(id, signal), [client, id]));
  const [handoff, setHandoff] = useState<MemberMutation | null>(null);
  const [ownershipTransferred, setOwnershipTransferred] = useState(false);
  const command = useAdministrationCommand();
  const member = resource.value;
  async function change(value: MemberChange) {
    if (!member || resource.refreshing || resource.error) return;
    const result = await command.execute(JSON.stringify([id, member.version, value]), (key, signal) => client.changeMember(member, value, key, signal));
    if (!result) return;
    if (value.kind === "ownership") { setOwnershipTransferred(true); return; }
    if (result.temporaryPassword) setHandoff(result); else resource.refresh();
  }
  if (handoff?.temporaryPassword) return <CredentialHandoff login={handoff.member.login} password={handoff.temporaryPassword} hostname={window.location.hostname}
    onDone={() => { setHandoff(null); resource.refresh(); }} />;
  const cannotEdit = command.pending || member?.status === "revoked" || (!session.identity.owner && member?.role === "workspace_admin");
  const cannotManage = cannotEdit || member?.owner || session.identity.id === id;
  if (ownershipTransferred) return <section className={styles.section}>
    <h1>{locale === "ru" ? "Управление передано" : "Ownership transferred"}</h1>
    <p>{locale === "ru" ? "Главный администратор обновлён. Войдите снова, чтобы продолжить работу со своими текущими правами."
      : "The company owner has been updated. Sign in again to continue with your current permissions."}</p>
    <a className={styles.primary} href="/admin/">{locale === "ru" ? "Войти в Falcon" : "Sign in to Falcon"}</a>
  </section>;
  return <>
    <button className={styles.back} disabled={command.pending} onClick={onBack}><ArrowLeft size={16} />{copy.employees}</button>
    {resource.loading || !member ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} /> : <>
      {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
    <header className={styles.heading}><div><h1>{member.name}</h1><div className={styles.meta}><StatusBadge status={member.status} member />
        {member.owner && <span>{copy.owner}</span>}<span>{member.login}</span></div></div></header>
      {command.error === "REAUTHENTICATION_REQUIRED" ? <SessionConfirmation client={client} onConfirmed={command.clearError} />
        : command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
      <div className={styles.sections} key={member.version}>
        <ProfileAvatarEditor identityId={id} name={member.name} hasAvatar={member.hasAvatar} version={member.version} client={client} disabled={cannotEdit} onSaved={resource.refresh} />
        <MemberDetailsForm member={member} disabled={cannotEdit} onChange={change} />
        <MemberSecurity member={member} disabled={cannotManage} allowAdmin={session.identity.owner} onChange={change} />
      </div>
    </>}
  </>;
}
