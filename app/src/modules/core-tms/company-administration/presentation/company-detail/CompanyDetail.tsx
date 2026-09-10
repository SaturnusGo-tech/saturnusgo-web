"use client";

import { AdministrationJournal } from "../audit/AdministrationJournal";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useCallback } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { CompanyChange } from "../../domain/administration";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import { CompanyDetailsForm } from "../company-edit/CompanyDetailsForm";
import { CompanyCapacityForm } from "../company-edit/CompanyCapacityForm";
import { CompanyOwnerAccess } from "../company-owner/CompanyOwnerAccess";
import { CompanyLifecycle } from "../company-status/CompanyLifecycle";
import { SessionConfirmation } from "../reauthentication/SessionConfirmation";
import styles from "../layout/administration.module.css";

export function CompanyDetail({ id, client, onBack }: { readonly id: string; readonly client: AdministrationPort; readonly onBack: () => void }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal) => client.company(id, signal), [client, id]));
  const command = useAdministrationCommand();
  const company = resource.value;
  async function change(value: CompanyChange) {
    if (!company || resource.refreshing || resource.error) return;
    const result = await command.execute(JSON.stringify([id, company.version, value]), (key, signal) => client.changeCompany(company, value, key, signal));
    if (result) resource.refresh();
  }
  return <>
    <button className={styles.back} onClick={onBack} disabled={command.pending}><ArrowLeft size={16} />{copy.companies}</button>
    {resource.loading || !company ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} /> : <>
      {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
    <header className={styles.heading}><div><h1>{company.name}</h1><div className={styles.meta}><StatusBadge status={company.status} /><span>{company.domain?.hostname}</span></div></div>
        {company.domain?.status === "active" && company.status === "active" && <a className={styles.button} href={`https://${company.domain.hostname}/admin/`} target="_blank" rel="noopener noreferrer">{copy.openFalcon}<ArrowUpRight size={16} /></a>}
      </header>
      {command.error === "REAUTHENTICATION_REQUIRED" ? <SessionConfirmation client={client} onConfirmed={command.clearError} />
        : command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
      <div className={styles.sections} key={company.version}>
        <section className={styles.section}><h2>{copy.address}</h2><div className={styles.meta}><span>{company.domain?.hostname}</span><StatusBadge status={company.domain?.status === "active" ? "verified" : company.domain?.status ?? "reserved"} /></div>
          {company.domain?.errorCode && <p className={styles.hint}>{locale === "ru" ? "Не удалось подключить адрес. Проверьте DNS и повторите подключение." : "Could not connect the address. Check DNS and try again."}</p>}
          {company.domain?.status === "failed" && <div className={styles.actions}><button className={styles.button} disabled={command.pending} onClick={() => void change({ kind: "retry_domain" })}>{copy.retryDomain}</button></div>}
          {company.status === "provisioning" && <div className={styles.actions}><button className={styles.button} onClick={resource.refresh}>{locale === "ru" ? "Проверить подключение" : "Check connection"}</button></div>}
        </section>
        <CompanyDetailsForm company={company} pending={command.pending || company.status === "archived"} onChange={change} />
        <CompanyCapacityForm company={company} pending={command.pending || company.status === "archived"} onChange={change} />
        <CompanyOwnerAccess company={company} client={client} pending={command.pending} onChange={change} />
        <CompanyLifecycle company={company} pending={command.pending} onChange={change} />
        <AdministrationJournal client={client} platform companyId={id} />
      </div>
    </>}
  </>;
}
