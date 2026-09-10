"use client";

import { ChevronRight, Plus, UsersRound } from "lucide-react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import styles from "../layout/administration.module.css";

export function MemberList({ client, onOpen, onCreate }: {
  readonly client: AdministrationPort; readonly onOpen: (id: string) => void; readonly onCreate: () => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const list = useAdministrationList(client.members);
  return <>
    <header className={styles.heading}><h1>{copy.employees}</h1><button className={styles.primary} onClick={onCreate}><Plus size={17} />{copy.newMember}</button></header>
    <div className={styles.toolbar}><AccessField label={copy.memberSearch} type="search" value={list.search} maxLength={200} onChange={(event) => list.setSearch(event.target.value)} /></div>
    {list.loading || (list.error && !list.items.length) ? <ResourceState loading={list.loading} error={list.error} retry={list.refresh} />
      : !list.items.length ? <div className={styles.empty}><UsersRound size={35} strokeWidth={1.1} /><h2>{copy.noMembers}</h2></div>
      : <div className={styles.list}>{list.items.map((member) => <button key={member.identityId} className={styles.row} onClick={() => onOpen(member.identityId)}>
        <span className={styles.rowTitle}><span className={styles.avatar}>{member.name.slice(0, 2).toUpperCase()}</span><span><strong>{member.name}</strong><small>{member.email}</small></span></span>
        <StatusBadge status={member.status} member /><small>{member.owner ? copy.owner : member.login}</small><ChevronRight size={16} />
      </button>)}</div>}
    {list.error && list.items.length > 0 && <ResourceState loading={false} error={list.error} retry={() => void list.more()} />}
    {list.cursor && <div className={styles.actions}><button className={styles.button} disabled={list.pending} onClick={() => void list.more()}>{copy.more}</button></div>}
  </>;
}
