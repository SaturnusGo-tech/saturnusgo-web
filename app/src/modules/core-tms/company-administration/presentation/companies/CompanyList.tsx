"use client";

import { Building2, ChevronRight, Plus } from "lucide-react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import styles from "../layout/administration.module.css";

export function CompanyList({ client, onOpen, onCreate }: {
  readonly client: AdministrationPort; readonly onOpen: (id: string) => void; readonly onCreate: () => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const list = useAdministrationList(client.companies);
  return <>
    <header className={styles.heading}><h1>{copy.companies}</h1><button className={styles.primary} onClick={onCreate}><Plus size={17} />{copy.newCompany}</button></header>
    <div className={styles.toolbar}><AccessField label={copy.search} value={list.search} onChange={(event) => list.setSearch(event.target.value)} type="search" maxLength={200} /></div>
    {list.loading || (list.error && !list.items.length) ? <ResourceState loading={list.loading} error={list.error} retry={list.refresh} />
      : !list.items.length ? <div className={styles.empty}><Building2 size={35} strokeWidth={1.1} /><h2>{list.search ? copy.noResults : copy.noCompanies}</h2></div>
      : <div className={styles.list}>{list.items.map((company) => <button key={company.workspaceId} className={styles.row} onClick={() => onOpen(company.workspaceId)}>
        <span className={styles.rowTitle}><span className={styles.symbol}><Building2 size={18} strokeWidth={1.5} /></span><span><strong>{company.name}</strong><small>{company.domain?.hostname}</small></span></span>
        <StatusBadge status={company.status} /><small>{company.occupiedSeats} / {company.maxMembers}</small><ChevronRight size={16} />
      </button>)}</div>}
    {list.error && list.items.length > 0 && <ResourceState loading={false} error={list.error} retry={() => void list.more()} />}
    {list.cursor && <div className={styles.actions}><button className={styles.button} disabled={list.pending} onClick={() => void list.more()}>{copy.more}</button></div>}
  </>;
}
