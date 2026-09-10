"use client";

import { useState } from "react";
import type { Company, CompanyChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function CompanyLifecycle({ company, pending, onChange }: {
  readonly company: Company; readonly pending: boolean; readonly onChange: (change: CompanyChange) => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [confirmation, setConfirmation] = useState<{ label: string; change: CompanyChange } | null>(null);
  if (company.status === "archived") return null;
  return <section className={styles.section}><h2>{copy.security}</h2>
    <div className={styles.actions}>
      {company.status === "suspended" ? <button className={styles.button} disabled={pending} onClick={() => setConfirmation({ label: copy.resume, change: { kind: "status", status: "active" } })}>{copy.resume}</button>
        : <button className={styles.button} disabled={pending} onClick={() => setConfirmation({ label: copy.suspend, change: { kind: "status", status: "suspended" } })}>{copy.suspend}</button>}
      <button className={`${styles.button} ${styles.danger}`} disabled={pending} onClick={() => setConfirmation({ label: copy.archive, change: { kind: "status", status: "archived" } })}>{copy.archive}</button>
    </div>
    {confirmation && <div className={styles.confirmation}><p>{confirmation.label}: {company.name}?</p>
      <div className={styles.actions}><button className={styles.primary} disabled={pending} onClick={() => void onChange(confirmation.change).then(() => setConfirmation(null))}>{copy.confirm}</button>
        <button className={styles.button} disabled={pending} onClick={() => setConfirmation(null)}>{copy.cancel}</button></div>
    </div>}
  </section>;
}
