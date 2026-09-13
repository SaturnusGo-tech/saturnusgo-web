"use client";
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
  return <article className={styles.company}>
    <header className={styles.header}><span>{copy.companyDetails}</span><StatusBadge status={company.status} /></header>
    <h1>{company.name}</h1>
    {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
    <dl className={styles.properties}>
      <dt>{copy.address}</dt><dd>{company.domain?.hostname ? <a href={`https://${company.domain.hostname}`}>{company.domain.hostname}</a> : "—"}</dd>
      <dt>{copy.contact}</dt><dd><a href={`mailto:${company.accessContactEmail}`}>{company.accessContactEmail}</a></dd>
    </dl>
    <h2>{copy.legalDetails}</h2>
    <dl className={styles.properties}>
      <dt>{copy.legalName}</dt><dd>{company.legal.legalName}</dd>
      <dt>{copy.countryCode}</dt><dd>{company.legal.countryCode}</dd>
      {(["legalForm", "taxId", "registrationId", "taxBranchId", "legalAddress"] as const).filter((key) => company.legal[key]).map((key) =>
        <div className={styles.pair} key={key}><dt>{copy[key]}</dt><dd>{company.legal[key]}</dd></div>)}
    </dl>
  </article>;
}
