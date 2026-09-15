import { ChevronDown, FileText, ShieldCheck, Play, Paperclip, Bug } from "lucide-react";
import type { AdministrationEvent } from "../../domain/administration";
import { eventPresentation, groupActivityByDay } from "../activity-model/event-presentation";
import styles from "./activity-feed.module.css";

function ActivityEntry({ event, locale, subjectName }: { event: AdministrationEvent; locale: "ru" | "en"; subjectName?: string }) {
  const ru = locale === "ru";
  const view = eventPresentation(event, locale);
  const Icon = { access: ShieldCheck, run: Play, file: Paperclip, defect: Bug, work: FileText }[view.tone] ?? FileText;
  return <li className={styles.entry}>
    <span className={styles.icon} data-tone={view.tone}><Icon size={16} aria-hidden="true" /></span>
    <div className={styles.content}><div className={styles.line}><strong>{view.title}</strong>
      <time dateTime={event.occurredAt} title={new Date(event.occurredAt).toLocaleString(locale)}>
        {new Date(event.occurredAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</time></div>
      {view.target && view.target !== subjectName && <p className={styles.target}>{view.target}</p>}
      {event.actorName !== subjectName && <p className={styles.actor}>{event.actorName}</p>}
      <details className={styles.details}><summary aria-label={`${ru ? "Подробности" : "Details"}: ${view.title}`}><ChevronDown size={12} />{ru ? "Подробности" : "Details"}</summary>
        <dl><dt>{ru ? "Событие" : "Event"}</dt><dd>{event.action}</dd>
          <dt>{ru ? "Объект" : "Object"}</dt><dd>{event.targetName}</dd>
          <dt>{ru ? "Номер записи" : "Record ID"}</dt><dd>{event.id}</dd>
          <dt>{ru ? "Номер запроса" : "Request ID"}</dt><dd>{event.requestId}</dd>
          {event.status && <><dt>{ru ? "Состояние в записи" : "Recorded state"}</dt><dd>{event.status}</dd></>}
        </dl>
      </details>
    </div>
  </li>;
}
export function ActivityFeed({ events, locale, subjectName }: { events: readonly AdministrationEvent[]; locale: "ru" | "en"; subjectName?: string }) {
  return <div className={styles.feed}>{groupActivityByDay(events, locale).map(({ day, events: items }) => {
    const work = items.filter((event) => !eventPresentation(event, locale).technical);
    const service = items.filter((event) => eventPresentation(event, locale).technical);
    return <section key={day} className={styles.day} aria-label={day}><h2>{day}</h2>
      {!!work.length && <ol>{work.map((event) => <ActivityEntry key={event.id} event={event} locale={locale} subjectName={subjectName} />)}</ol>}
      {!!service.length && <details className={styles.service}><summary><ChevronDown size={14} />{locale === "ru" ? "Служебные события" : "Service events"}<span>{service.length}</span></summary>
        <ol>{service.map((event) => <ActivityEntry key={event.id} event={event} locale={locale} subjectName={subjectName} />)}</ol>
      </details>}
    </section>;
  })}</div>;
}
