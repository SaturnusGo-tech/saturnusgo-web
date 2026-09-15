import { useCallback } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { CompanyMember, MemberChange } from "../../domain/administration";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { memberRoleLabel } from "../permissions/member-role-label";
import { MemberActions } from "../member-actions/MemberActions";
import styles from "./directory.module.css";

export function MemberDirectoryRow({ member, client, selected, disabled, canEdit, canManage, onAction, onOpen }: {
  readonly member: CompanyMember; readonly client: AdministrationPort; readonly selected: boolean;
  readonly canEdit: boolean; readonly canManage: boolean; readonly onAction: (id: string, change: MemberChange | "edit") => void;
  readonly disabled: boolean; readonly onOpen: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const load = useCallback((signal: AbortSignal) => client.avatar(member.identityId, signal), [client, member.identityId]);
  const status = member.status === "active" ? copy.memberActive : member.status === "pending"
    ? (locale === "ru" ? "Ожидает входа" : "Awaiting sign-in") : copy[member.status];
  return <div className={styles.person} data-selected={selected || undefined}>
    <button className={styles.personLink} aria-current={selected ? "true" : undefined} disabled={disabled} onClick={() => onOpen(member.identityId)}>
    <ManagedAvatarImage className={styles.avatar} name={member.name} hasAvatar={member.hasAvatar} version={member.version} load={load} />
    <span className={styles.identity}><strong>{member.name}</strong><small>{member.email}</small><small>{memberRoleLabel(member.role, locale)} · {status}</small></span>
    </button><MemberActions member={member} disabled={disabled || !canEdit} canManage={canManage}
      onEdit={() => onAction(member.identityId, "edit")} onChange={(change) => onAction(member.identityId, change)} />
  </div>;
}
