import type { AdministrationEvent } from "../../domain/administration";
import { administrationEventLabel } from "../audit-copy/administration-event-label";

// Public keys such as HOST-TC-337 remain useful; storage identifiers belong in details.
export function isInternalIdentifier(value: string): boolean {
  return /^(?:[a-z][a-z_]*[_-])(?:[0-9a-f]{12,}|[0-9a-f]{8}-|\d{10,})/i.test(value)
    || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    || /^(?:identity|attachment|case|folder|run_item|run_step|step|req|request|event|audit|session|token)_/i.test(value);
}
export function eventPresentation(event: AdministrationEvent, locale: "ru" | "en") {
  const accessLabels: Record<string, readonly [string, string]> = {
    blocked: ["Сотрудник заблокирован", "Person blocked"], revoked: ["Доступ сотрудника отозван", "Person access revoked"],
    active: ["Доступ сотрудника включён", "Person access enabled"],
  };
  const accessTitle = event.action === "member.status" && event.status ? accessLabels[event.status]?.[locale === "ru" ? 0 : 1] : null;
  const title = accessTitle ?? administrationEventLabel(event.action, locale);
  const unknown = title === "Служебное событие" || title === "Service event";
  const technical = unknown || /^(?:attachment\.(?:read_grant|cleanup|upload_intent|lifecycle)|suite\.resolved)/.test(event.action);
  const target = isInternalIdentifier(event.targetName) ? null : event.targetName;
  const group = event.action.split(".")[0];
  const tone = /^(access|identity|member|profile)/.test(group) ? "access" : /^(run|run_item|run_step)/.test(group) ? "run"
    : group === "defect" ? "defect" : group === "attachment" ? "file" : "work";
  return { title, target, technical, tone };
}
export function groupActivityByDay(events: readonly AdministrationEvent[], locale: "ru" | "en") {
  const groups = new Map<string, { day: string; events: AdministrationEvent[] }>();
  for (const event of events) {
    const day = new Date(event.occurredAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    if (!groups.has(day)) groups.set(day, { day, events: [] });
    groups.get(day)!.events.push(event);
  }
  return [...groups.values()];
}
