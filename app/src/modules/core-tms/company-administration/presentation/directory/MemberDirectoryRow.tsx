import { useCallback } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { CompanyMember } from "../../domain/administration";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { memberRoleLabel } from "../permissions/member-role-label";
import styles from "./directory.module.css";

export function MemberDirectoryRow({ member, client, selected, disabled, onOpen }: {
  readonly member: CompanyMember; readonly client: AdministrationPort; readonly selected: boolean;
  readonly disabled: boolean; readonly onOpen: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const load = useCallback((signal: AbortSignal) => client.avatar(member.identityId, signal), [client, member.identityId]);
  const status = member.status === "active" ? copy.memberActive : member.status === "pending"
    ? (locale === "ru" ? "Ожидает входа" : "Awaiting sign-in") : copy[member.status];
  return <button className={styles.person} aria-current={selected ? "true" : undefined} disabled={disabled}
    onClick={() => onOpen(member.identityId)}>
    <ManagedAvatarImage className={styles.avatar} name={member.name} hasAvatar={member.hasAvatar} version={member.version} load={load} />
    <span className={styles.identity}><strong>{member.name}</strong><small>{member.email} · {memberRoleLabel(member.role, locale)}</small></span>
    <span className={styles.status} data-status={member.status}>{status}</span>
  </button>;
}
