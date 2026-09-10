"use client";

import { ArrowLeft } from "lucide-react";
import { useCallback, useState } from "react";
import type { CompanyCreated, CompanyDraft } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { ResourceState } from "../common/ResourceState";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { LegalFields } from "../fields/LegalFields";
import { MemberFields } from "../fields/MemberFields";
import { CapabilityFields } from "../capabilities/CapabilityFields";
import { CredentialHandoff } from "../handoff/CredentialHandoff";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

const empty: CompanyDraft = { name: "", slug: "", legal: { legalName: "", countryCode: "RU", legalForm: "", taxId: "", registrationId: "", taxBranchId: "", legalAddress: "" },
  accessContactEmail: "", maxMembers: 10, capabilities: ["core"], administrator: { name: "", login: "", email: "", phone: "" } };

export function CreateCompany({ client, onBack, onCreated }: {
  readonly client: AdministrationPort; readonly onBack: () => void; readonly onCreated: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [draft, setDraft] = useState<CompanyDraft>(empty);
  const [created, setCreated] = useState<CompanyCreated | null>(null);
  const command = useAdministrationCommand();
  const options = useAdministrationResource(useCallback((signal) => client.companyOptions(signal), [client]));
  if (created?.temporaryPassword) return <CredentialHandoff login={draft.administrator.login} password={created.temporaryPassword}
    hostname={created.company.domain?.hostname ?? null} onDone={() => onCreated(created.company.workspaceId)} />;
  return <>
    <button className={styles.back} onClick={onBack} disabled={command.pending}><ArrowLeft size={16} />{copy.back}</button>
    <header className={styles.heading}><h1>{copy.newCompany}</h1></header>
    {options.error && <ResourceState loading={false} error={options.error} retry={options.refresh} />}
    <form className={styles.sections} onSubmit={(event) => {
      event.preventDefault();
      const payload = { ...draft, accessContactEmail: draft.accessContactEmail.trim() || draft.administrator.email.trim() };
      void command.execute(JSON.stringify(payload), (key, signal) => client.createCompany(payload, key, signal)).then((result) => {
        if (!result) return;
        if (result.temporaryPassword) setCreated(result); else onCreated(result.company.workspaceId);
      });
    }}>
      <section className={styles.section}><h2>{copy.companyDetails}</h2><div className={styles.fields}>
        <AccessField label={copy.name} required maxLength={200} value={draft.name} disabled={command.pending}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <AccessField label={copy.address} hint={options.value ? `${draft.slug || "company"}-falcon.${options.value.domainSuffix}` : undefined} required minLength={2} maxLength={48} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="company"
          value={draft.slug} disabled={command.pending} onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase() })} />
      </div></section>
      <section className={styles.section}><h2>{copy.legalDetails}</h2><LegalFields copy={copy} legal={draft.legal} disabled={command.pending} onChange={(legal) => setDraft({ ...draft, legal })} /></section>
      <section className={styles.section}><h2>{copy.access}</h2><div className={styles.fields}>
        <AccessField label={copy.limit} type="number" min={1} max={100000} required value={draft.maxMembers} disabled={command.pending}
          onChange={(event) => setDraft({ ...draft, maxMembers: Number(event.target.value) })} />
        <AccessField label={copy.contact} hint={copy.contactHelp} type="email" placeholder={draft.administrator.email} value={draft.accessContactEmail} disabled={command.pending}
          onChange={(event) => setDraft({ ...draft, accessContactEmail: event.target.value })} />
      </div><CapabilityFields value={draft.capabilities} disabled={command.pending} onChange={(capabilities) => setDraft({ ...draft, capabilities })} /></section>
      <section className={styles.section}><h2>{copy.administrator}</h2><MemberFields copy={copy} draft={draft.administrator} disabled={command.pending}
        onChange={(administrator) => setDraft({ ...draft, administrator })} /><p className={styles.hint}>{copy.temporaryHelp}</p></section>
      {command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
      <div className={styles.formFooter}><button type="submit" className={styles.primary} disabled={command.pending || !options.value}>{copy.newCompany}</button>
        <button type="button" className={styles.button} onClick={onBack} disabled={command.pending}>{copy.cancel}</button></div>
    </form>
  </>;
}
