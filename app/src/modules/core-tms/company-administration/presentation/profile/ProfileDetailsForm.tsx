"use client";

import { useState } from "react";
import type { Profile } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";
import profileStyles from "./profile-details.module.css";

export function ProfileDetailsForm({ profile, client, onSaved }: { readonly profile: Profile; readonly client: AdministrationPort; readonly onSaved: () => void }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const command = useAdministrationCommand();
  return <form className={profileStyles.form} onSubmit={(event) => {
    event.preventDefault();
    void command.execute(JSON.stringify([profile.version, name, phone]), async (_, signal) => {
      await client.updateProfile(profile, { name, phone }, signal); return true;
    }).then((saved) => { if (saved) onSaved(); });
  }}>
    <div className={profileStyles.fields}>
      <AccessField label={copy.personName} autoComplete="name" required maxLength={200} disabled={command.pending} value={name} onChange={(event) => setName(event.target.value)} />
      <AccessField label={copy.phone} type="tel" autoComplete="tel" pattern="[+][1-9][0-9]{7,14}|" maxLength={16} disabled={command.pending} value={phone} onChange={(event) => setPhone(event.target.value)} />
      <div className={profileStyles.identity}><span>{copy.login}</span><p>{profile.login}</p>{profile.role && <small>{copy.loginHint}</small>}</div>
      <div className={profileStyles.identity}><span>{copy.email}</span><p>{profile.email}</p>{profile.role && <small>{copy.emailHint}</small>}</div>
    </div>
    {command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
    <div className={styles.actions}><button className={styles.primary} type="submit" disabled={command.pending}>{copy.save}</button></div>
  </form>;
}
