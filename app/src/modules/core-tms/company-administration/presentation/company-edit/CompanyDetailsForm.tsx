"use client";

import { useState } from "react";
import type { Company, CompanyChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { LegalFields } from "../fields/LegalFields";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function CompanyDetailsForm({ company, pending, onChange }: {
  readonly company: Company; readonly pending: boolean; readonly onChange: (change: CompanyChange) => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [draft, setDraft] = useState({ name: company.name, legal: company.legal, accessContactEmail: company.accessContactEmail });
  return <form className={styles.sections} onSubmit={(event) => { event.preventDefault(); void onChange({ kind: "details", ...draft }); }}>
    <section className={styles.section}><h2>{copy.companyDetails}</h2><div className={styles.fields}>
      <AccessField label={copy.name} required maxLength={200} value={draft.name} disabled={pending} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <AccessField label={copy.contact} hint={copy.contactHelp} type="email" required value={draft.accessContactEmail} disabled={pending} onChange={(event) => setDraft({ ...draft, accessContactEmail: event.target.value })} />
    </div></section>
    <section className={styles.section}><h2>{copy.legalDetails}</h2><LegalFields legal={draft.legal} copy={copy} disabled={pending} onChange={(legal) => setDraft({ ...draft, legal })} /></section>
    <div className={styles.formFooter}><button className={styles.primary} disabled={pending} type="submit">{copy.save}</button></div>
  </form>;
}
