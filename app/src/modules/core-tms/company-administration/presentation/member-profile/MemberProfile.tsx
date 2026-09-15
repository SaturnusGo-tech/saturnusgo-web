"use client";
import { useCallback, type ReactNode } from "react";
import { Pencil, X } from "lucide-react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { CompanyMember, MemberChange } from "../../domain/administration";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { MemberActions } from "../member-actions/MemberActions";
import { memberRoleLabel } from "../permissions/member-role-label";
import { StatusBadge } from "../common/StatusBadge";
import { AdministrationJournal } from "../audit/AdministrationJournal";
import styles from "./member-profile.module.css";

export function MemberProfile({ member, client, disabled, canManage, editing, onEdit, onBack, onChange, children, notice }: {
  readonly member: CompanyMember; readonly client: AdministrationPort; readonly disabled: boolean; readonly canManage: boolean;
  readonly editing: boolean; readonly onEdit: () => void; readonly onBack: () => void;
  readonly onChange: (value: MemberChange) => void; readonly children: ReactNode; readonly notice: ReactNode;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const load = useCallback((signal: AbortSignal) => client.avatar(member.identityId, signal), [client, member.identityId]);
  return <div className={styles.profile}>
    <header className={styles.header}><div><h1>{member.name}</h1><p>{member.email}</p></div>
      <div className={styles.actions}><MemberActions member={member} disabled={disabled} canManage={canManage} onEdit={onEdit} onChange={onChange} />
        <button aria-label={ru ? "Закрыть сотрудника" : "Close person"} onClick={onBack}><X size={20} /></button></div>
    </header>
    {notice}
    {editing ? <div className={styles.edit}>{children}</div> : <div className={styles.columns}>
      <aside className={styles.info}>
        <ManagedAvatarImage className={styles.photo} name={member.name} hasAvatar={member.hasAvatar} version={member.version} load={load} />
        <div className={styles.infoHeading}><h2>{ru ? "Данные сотрудника" : "Person details"}</h2><button disabled={disabled} onClick={onEdit} aria-label={ru ? "Редактировать данные" : "Edit details"}><Pencil size={16} /></button></div>
        <dl><dt>{ru ? "Имя" : "Name"}</dt><dd>{member.name}</dd>
          <dt>{ru ? "Рабочая почта" : "Work email"}</dt><dd>{member.email}</dd>
          <dt>{ru ? "Логин" : "Username"}</dt><dd>{member.login}</dd>
          <dt>{ru ? "Телефон" : "Phone"}</dt><dd>{member.phone || (ru ? "Не указан" : "Not provided")}</dd>
          <dt>{ru ? "Роль" : "Role"}</dt><dd>{memberRoleLabel(member.role, locale)}{member.owner && <small>{ru ? "Главный администратор" : "Company owner"}</small>}</dd>
          <dt>{ru ? "Доступ" : "Access"}</dt><dd><StatusBadge status={member.status} member /></dd>
          <dt>{ru ? "Двухфакторная защита" : "Two-step sign-in"}</dt><dd>{member.mfaEnabled ? (ru ? "Включена" : "Enabled") : (ru ? "Не включена" : "Not enabled")}</dd>
          <dt>{ru ? "Почта подтверждена" : "Email verified"}</dt><dd>{member.emailVerified ? (ru ? "Да" : "Yes") : (ru ? "Нет" : "No")}</dd>
          <dt>{ru ? "Добавлен" : "Added"}</dt><dd><time dateTime={member.createdAt}>{new Date(member.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</time></dd>
        </dl>
      </aside>
      <div className={styles.activity}><AdministrationJournal key={`${member.identityId}:${member.version}`} client={client} platform={false} memberId={member.identityId} subjectName={member.name} /></div>
    </div>}
  </div>;
}
