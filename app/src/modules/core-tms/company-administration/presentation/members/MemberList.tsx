"use client";

import { Plus, Search, UserRoundPlus } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { MemberDirectoryRow } from "../directory/MemberDirectoryRow";
import styles from "../directory/directory.module.css";

export function MemberList({ client, onOpen, onCreate, selectedId, creating, version, disabled }: {
  readonly client: AdministrationPort; readonly onOpen: (id: string) => void; readonly onCreate: () => void;
  readonly selectedId: string | null; readonly creating: boolean; readonly version: number; readonly disabled: boolean;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const list = useAdministrationList(client.members);
  const directory = useRef<HTMLElement | null>(null);
  const covered = creating || !!selectedId;
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 1050px)");
    const update = () => { if (directory.current) directory.current.inert = covered && narrow.matches; };
    const frame = requestAnimationFrame(update);
    narrow.addEventListener("change", update);
    return () => { cancelAnimationFrame(frame); narrow.removeEventListener("change", update); if (directory.current) directory.current.inert = false; };
  }, [covered]);
  useEffect(() => { if (version) list.refresh(); }, [version, list.refresh]);
  return <section ref={directory} className={styles.directory} aria-label={copy.employees}>
    <header className={styles.heading}><h1>{copy.employees}</h1><button onClick={onCreate} disabled={disabled}
      aria-label={copy.newMember} title={copy.newMember}><Plus size={23} strokeWidth={1.5} /></button></header>
    <label className={styles.search}><Search size={19} strokeWidth={1.6} /><input type="search" aria-label={copy.memberSearch}
      placeholder={copy.memberSearch} value={list.search} maxLength={200} onChange={(event) => list.setSearch(event.target.value)} /></label>
    <div className={styles.people} aria-busy={list.loading}>
      {list.loading ? <div className={styles.skeletons} aria-label={locale === "ru" ? "Загрузка сотрудников" : "Loading people"}>
        {[0, 1, 2].map((item) => <div className={styles.skeletonRow} key={item}><i /><span /><span /></div>)}
      </div> : list.items.map((member) => <MemberDirectoryRow key={member.identityId} member={member} client={client}
        selected={selectedId === member.identityId && !creating} disabled={disabled} onOpen={onOpen} />)}
      {!list.loading && !list.error && !list.items.length && <p className={styles.empty}>{copy.noMembers}</p>}
      {list.error && <ResourceState loading={false} error={list.error} retry={list.refresh} />}
      {creating && <div className={styles.newPerson} aria-current="true"><UserRoundPlus size={26} strokeWidth={1.4} />
        {locale === "ru" ? "Новый сотрудник" : "New person"}</div>}
      {list.cursor && <button className={styles.more} disabled={list.pending} onClick={() => void list.more()}>{copy.more}</button>}
    </div>
  </section>;
}
