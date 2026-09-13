"use client";

import { useState, type ReactNode } from "react";
import type { CompanyMember, MemberChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { StatusBadge } from "../common/StatusBadge";
import styles from "../editor/editor.module.css";

export function MemberDetailsForm({ member, disabled, onChange, onBack, children }: {
  readonly member: CompanyMember; readonly disabled: boolean; readonly onChange: (change: MemberChange) => Promise<boolean>;
  readonly onBack: () => void; readonly children: ReactNode;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [fields, setFields] = useState({ name: member.name, login: member.login, email: member.email, phone: member.phone });
  const dirty = Object.keys(fields).some((key) => fields[key as keyof typeof fields] !== member[key as keyof typeof fields]);
  return <div className={styles.editor}>
    <header className={styles.header}><h2>{locale === "ru" ? "Сотрудник" : "Person"}</h2><div>
      <button type="button" onClick={onBack} disabled={disabled}>{locale === "ru" ? "Закрыть" : "Close"}</button>
      <button className={styles.primary} form="member-details" type="submit" disabled={disabled || !dirty}>{copy.save}</button>
    </div></header>
    <div className={styles.body}>
      <form id="member-details" onSubmit={(event) => { event.preventDefault(); void onChange({ kind: "details", ...fields,
        name: fields.name.trim(), email: fields.email.trim().toLowerCase() }); }}>
        <input className={styles.name} aria-label={copy.personName} value={fields.name} required maxLength={200} disabled={disabled}
          onChange={(event) => setFields({ ...fields, name: event.target.value })} />
        <div className={styles.meta}><StatusBadge status={member.status} member />{member.owner && <span>{copy.owner}</span>}</div>
        <label className={styles.field}><span>{locale === "ru" ? "Рабочая почта" : "Work email"}</span><input type="email" required maxLength={254}
          disabled={disabled || member.owner} value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} /></label>
        <label className={styles.field}><span>{copy.login}</span><input required minLength={3} maxLength={64} pattern="[a-z0-9][a-z0-9._-]{2,63}"
          disabled={disabled || member.owner} value={fields.login} onChange={(event) => setFields({ ...fields, login: event.target.value.toLowerCase() })} /></label>
        <label className={styles.field}><span>{copy.phone}</span><input type="tel" pattern="[+][1-9][0-9]{7,14}" maxLength={16}
          disabled={disabled} value={fields.phone} onChange={(event) => setFields({ ...fields, phone: event.target.value })} /></label>
      </form>
      {children}
    </div>
  </div>;
}
