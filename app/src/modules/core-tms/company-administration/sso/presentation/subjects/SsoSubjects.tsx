"use client";
import { useCallback, useState } from "react";
import type { AdministrationPort } from "../../../application/ports/administration-port";
import { useAdministrationList } from "../../../application/list/useAdministrationList";
import type { CompanySsoSubjects, SubjectMappingDraft } from "../../domain/company-sso";
import type { SsoCopy } from "../copy/sso-copy";
import styles from "../screen/sso.module.css";

export function SsoSubjects({ client, value, copy, pending, bind }: { readonly client: AdministrationPort;
  readonly value: CompanySsoSubjects; readonly copy: SsoCopy; readonly pending: boolean;
  readonly bind: (request: SubjectMappingDraft) => Promise<void> }) {
  const members = useAdministrationList(useCallback((search, cursor, signal) => client.members(search, cursor, signal), [client]));
  const [subject, setSubject] = useState("");
  const [identityId, setIdentity] = useState("");
  const activeMembers = members.items.filter(member => member.status === "active");
  const selected = activeMembers.some(member => member.identityId === identityId);
  return <section className={styles.section}><h2>{copy.subjects}</h2><p className={styles.hint}>{copy.mappingHint}</p>
    {value.subjects.length ? <ul className={styles.mappings}>{value.subjects.map(mapping => <li key={mapping.subject}>
      <span>{mapping.subject}</span><span><strong>{mapping.identityName}</strong><small>{mapping.email}</small></span>
    </li>)}</ul> : <p className={styles.hint}>{copy.empty}</p>}
    <form className={styles.form} onSubmit={event => { event.preventDefault(); if (selected) void bind({ subject: subject.trim(), identityId }); }}>
      <label>{copy.subject}<input value={subject} onChange={event => setSubject(event.target.value)} required maxLength={512} disabled={pending} /></label>
      <label>{copy.search}<input type="search" value={members.search} onChange={event => members.setSearch(event.target.value)} disabled={pending} /></label>
      <label>{copy.member}<select value={selected ? identityId : ""} required disabled={pending || members.loading || members.pending}
        onChange={event => setIdentity(event.target.value)}><option value="">{copy.choose}</option>
        {activeMembers.map(member => <option key={member.identityId} value={member.identityId}>{member.name} · {member.email || member.login}</option>)}
      </select></label>
      {members.error && <p className={styles.error} role="alert">{copy.error}<button type="button" onClick={members.refresh}>{copy.refresh}</button></p>}
      {members.cursor && <button type="button" disabled={members.pending} onClick={() => void members.more()}>{copy.more}</button>}
      <button className={styles.primary} disabled={pending || members.loading || members.pending || !selected} type="submit">{copy.bind}</button>
    </form>
  </section>;
}
