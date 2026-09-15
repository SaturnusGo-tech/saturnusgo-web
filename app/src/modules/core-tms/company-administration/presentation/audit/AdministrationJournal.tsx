"use client";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { JournalFilter } from "../../domain/administration";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { ResourceState } from "../common/ResourceState";
import { administrationEventLabel } from "../audit-copy/administration-event-label";
import { administrationCopy } from "../copy/administration-copy";
import { StatusBadge } from "../common/StatusBadge";
import styles from "./journal.module.css";

export function AdministrationJournal({ client, platform, companyId = null, memberId }: {
  readonly client: AdministrationPort; readonly platform: boolean; readonly companyId?: string | null; readonly memberId?: string;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const copy = administrationCopy(locale);
  const [category, setCategory] = useState<JournalFilter["category"]>(memberId ? "all" : "changes");
  const load = useCallback((search: string, cursor: string | null, signal: AbortSignal) => client.journal(platform, companyId, cursor, signal,
    { search, category, memberId }), [client, platform, companyId, category, memberId]);
  const resource = useAdministrationList(load);
  const options = [{ value: "changes", label: ru ? "Изменения" : "Changes" }, { value: "access", label: ru ? "Вход и безопасность" : "Sign-in and security" },
    { value: "all", label: ru ? "Все действия" : "All activity" }];
  return <section className={styles.journal} data-member={!!memberId}>
    <header className={styles.header}><h1>{ru ? (memberId ? "Действия сотрудника" : "Журнал действий") : "Activity log"}</h1></header>
    <div className={styles.toolbar}><label className={styles.search}><Search size={18} /><input type="search" maxLength={200}
      aria-label={ru ? (memberId ? "Ключ или участник" : "Найти по участнику") : (memberId ? "Key or person" : "Search by person")} placeholder={ru ? (memberId ? "Ключ или участник" : "Найти по участнику") : (memberId ? "Key or person" : "Search by person")}
      value={resource.search} onChange={(event) => resource.setSearch(event.target.value)} /></label>
      <AnimatedSelect label={ru ? "Действия" : "Activity"} value={category ?? "changes"} options={options}
        onChange={(value) => { if (value === "all" || value === "changes" || value === "access") setCategory(value); }} /></div>
    {resource.loading ? <div className={styles.loading} aria-busy="true">{[0, 1, 2, 3, 4].map((i) => <div key={i}><i /><i /><i /></div>)}</div>
      : <>
        {resource.items.length === 0 && !resource.error ? <p className={styles.empty}>{ru ? "Действий не найдено" : "No matching activity"}</p> :
          <div className={styles.table}><table><thead><tr><th>{ru ? "Действие" : "Activity"}</th><th>{ru ? "Участник" : "Actor"}</th><th>{ru ? "Время" : "Time"}</th></tr></thead>
            <tbody>{resource.items.map((event) => <tr key={event.id}>
              <td><div className={styles.action}>{administrationEventLabel(event.action, locale)}{event.status && <StatusBadge status={event.status} />}</div>
                <span className={styles.target}>{event.targetName}</span>
                {!memberId && <details className={styles.details}><summary>{ru ? "Подробности" : "Details"}</summary><code>{event.requestId}</code></details>}</td>
              <td>{event.actorName}</td><td><time dateTime={event.occurredAt} title={new Date(event.occurredAt).toLocaleString(locale)}>
                {new Date(event.occurredAt).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time></td>
            </tr>)}</tbody></table></div>}
      </>}
    {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
    {resource.cursor && <button className={styles.more} disabled={resource.pending} onClick={() => void resource.more()}>{copy.more}</button>}
  </section>;
}
