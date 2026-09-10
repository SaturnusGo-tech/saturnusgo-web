"use client";

import { useState } from "react";
import type { CompanyMember, MemberChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { MemberFields } from "../fields/MemberFields";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function MemberDetailsForm({ member, disabled, onChange }: {
  readonly member: CompanyMember; readonly disabled: boolean; readonly onChange: (change: MemberChange) => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [fields, setFields] = useState({ name: member.name, login: member.login, email: member.email, phone: member.phone });
  return <form className={styles.section} onSubmit={(event) => { event.preventDefault(); void onChange({ kind: "details", ...fields }); }}>
    <MemberFields draft={fields} copy={copy} disabled={disabled} onChange={(value) => setFields({ ...value, phone: value.phone ?? "" })} />
    <div className={styles.actions}><button className={styles.primary} disabled={disabled}>{copy.save}</button></div>
  </form>;
}
