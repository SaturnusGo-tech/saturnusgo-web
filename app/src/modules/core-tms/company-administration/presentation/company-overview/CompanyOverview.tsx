"use client";

import { ExternalLink, Globe2, Mail } from "lucide-react";
import type { Company } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import styles from "./company.module.css";

export function CompanyOverview({ resource }: { readonly resource: {
  readonly loading: boolean; readonly value: Company | null; readonly error: string | null; readonly refresh: () => void;
} }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const company = resource.value;
  if (resource.loading || !company) return <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />;
  const hostname = company.domain?.hostname;
  const legalFields = (["legalName", "countryCode", "legalForm", "taxId", "registrationId", "taxBranchId", "legalAddress"] as const)
    .filter((key) => company.legal[key]);
  return <article className={styles.company}>
    <header className={styles.header}>
      <h1>{copy.companyDetails}</h1>
      <StatusBadge status={company.status} />
    </header>
    {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
    <section>
      <h2>{locale === "ru" ? "Рабочее пространство" : "Workspace"}</h2>
      <dl className={styles.properties}>
        <div><dt>{locale === "ru" ? "Название" : "Name"}</dt><dd>{company.name}</dd></div>
        <div><dt>{copy.address}</dt><dd>{hostname ? <a href={`https://${hostname}`}>
          <Globe2 size={15} aria-hidden="true" /><span>{hostname}</span><ExternalLink size={13} aria-hidden="true" />
        </a> : <span className={styles.empty}>{locale === "ru" ? "Не указан" : "Not set"}</span>}</dd></div>
        <div><dt>{copy.contact}</dt><dd><a href={`mailto:${company.accessContactEmail}`}>
          <Mail size={15} aria-hidden="true" /><span>{company.accessContactEmail}</span>
        </a></dd></div>
      </dl>
    </section>
    <section>
      <h2>{copy.legalDetails}</h2>
      {legalFields.length > 0 ? <dl className={styles.properties}>{legalFields.map((key) =>
        <div key={key}><dt>{copy[key]}</dt><dd>{company.legal[key]}</dd></div>)}</dl> :
        <p className={styles.empty}>{locale === "ru" ? "Реквизиты не добавлены." : "No legal details on file."}</p>}
    </section>
  </article>;
}
