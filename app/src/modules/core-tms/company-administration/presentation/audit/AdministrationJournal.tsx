"use client";
import { History, RefreshCw } from "lucide-react";
import { useCallback } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResourceState } from "../common/ResourceState";
import { administrationEventLabel } from "../audit-copy/administration-event-label";
import { administrationCopy } from "../copy/administration-copy";
import { StatusBadge } from "../common/StatusBadge";
import styles from "../layout/administration.module.css";

export function AdministrationJournal({ client, platform, companyId = null }: {
  readonly client: AdministrationPort; readonly platform: boolean; readonly companyId?: string | null;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const load = useCallback((_: string, cursor: string | null, signal: AbortSignal) => client.journal(platform, companyId, cursor, signal), [client, platform, companyId]);
  const resource = useAdministrationList(load);
  return <section className={styles.section}>
    <div className={styles.heading}><h2>{locale === "ru" ? "Журнал действий" : "Activity log"}</h2>
      <button className={styles.button} onClick={resource.refresh} disabled={resource.loading} aria-label={locale === "ru" ? "Обновить журнал" : "Refresh log"}><RefreshCw size={15} /></button></div>
    {resource.loading || resource.error ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} /> :
      resource.items.length === 0 ? <p>{locale === "ru" ? "Действий пока нет" : "No activity yet"}</p> : <ol className={styles.journal}>
        {resource.items.map((event) => <li key={event.id}>
          <History size={16} aria-hidden="true" className={styles.eventIcon} />
          <div><div className={styles.eventTitle}>{administrationEventLabel(event.action, locale)}{event.status && <StatusBadge status={event.status} />}</div>
            <div className={styles.hint}>{event.actorName} · {event.targetName}</div>
            <details className={styles.eventDetails}><summary>{locale === "ru" ? "Подробности" : "Details"}</summary><code>{event.requestId}</code></details>
          </div>
          <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
        </li>)}
      </ol>}
    {resource.cursor && <button className={styles.button} disabled={resource.pending} onClick={() => void resource.more()}>{copy.more}</button>}
  </section>;
}
