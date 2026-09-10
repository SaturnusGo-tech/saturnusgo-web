"use client";
import { useCallback } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import styles from "../layout/administration.module.css";

export function CompanyOverview({ client }: { readonly client: AdministrationPort }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal) => client.ownCompany(signal), [client]));
  const company = resource.value;
  if (resource.loading || !company) return <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />;
  const capabilityNames = { core: locale === "ru" ? "Управление тестированием" : "Test management", integrations: locale === "ru" ? "Интеграции" : "Integrations",
    api_testing: locale === "ru" ? "API-тестирование" : "API testing", automation: locale === "ru" ? "Автоматизация" : "Automation", analytics: locale === "ru" ? "Аналитика" : "Analytics" };
  return <>
    {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
    <header className={styles.heading}><div><h1>{company.name}</h1><p>{company.domain?.hostname}</p></div><StatusBadge status={company.status} /></header>
    <div className={styles.sections}>
      <section className={styles.section}><h2>{copy.access}</h2><dl className={styles.details}>
        <dt>{copy.seats}</dt><dd>{company.occupiedSeats} / {company.maxMembers}</dd>
        <dt>{copy.capabilities}</dt><dd>{company.capabilities.map((key) => capabilityNames[key]).join(" · ")}</dd>
        <dt>{copy.contact}</dt><dd><a href={`mailto:${company.accessContactEmail}`}>{company.accessContactEmail}</a></dd>
      </dl></section>
      <section className={styles.section}><h2>{copy.legalDetails}</h2><dl className={styles.details}>
        <dt>{copy.legalName}</dt><dd>{company.legal.legalName}</dd>
        <dt>{copy.countryCode}</dt><dd>{company.legal.countryCode}</dd>
        {(["legalForm", "taxId", "registrationId", "taxBranchId", "legalAddress"] as const).filter((key) => company.legal[key]).map((key) =>
          <div className={styles.detailsPair} key={key}><dt>{copy[key]}</dt><dd>{company.legal[key]}</dd></div>)}
      </dl></section>
    </div>
  </>;
}
