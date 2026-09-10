"use client";

import { useState } from "react";
import type { Company, CompanyChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { CapabilityFields } from "../capabilities/CapabilityFields";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function CompanyCapacityForm({ company, pending, onChange }: {
  readonly company: Company; readonly pending: boolean; readonly onChange: (change: CompanyChange) => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [maxMembers, setMaxMembers] = useState(company.maxMembers);
  const [capabilities, setCapabilities] = useState(company.capabilities);
  return <form className={styles.section} onSubmit={(event) => { event.preventDefault(); void onChange({ kind: "capacity", maxMembers, capabilities }); }}>
    <h2>{copy.access}</h2><div className={styles.fields}>
      <AccessField label={copy.limit} type="number" required min={1} max={100000} value={maxMembers} disabled={pending} onChange={(event) => setMaxMembers(Number(event.target.value))} />
    </div><p className={styles.hint}>{copy.seats}: {company.occupiedSeats} / {company.maxMembers}</p>
    <CapabilityFields value={capabilities} disabled={pending} onChange={setCapabilities} />
    <div className={styles.actions}><button type="submit" className={styles.button} disabled={pending}>{copy.save}</button></div>
  </form>;
}
