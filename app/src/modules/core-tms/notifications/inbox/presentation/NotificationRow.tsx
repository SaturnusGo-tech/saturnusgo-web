import { Bell, Bug, Files, Layers, Play, ShieldCheck, UserRoundCheck, Webhook } from "lucide-react";
import type { NotificationItem } from "../../domain/notifications";
import { notificationHref, notificationTime } from "../model/presentation";
import css from "./inbox.module.css";

const categories = {
  runs: { icon: Play, ru: 'Прогоны', en: 'Test runs' },
  cases: { icon: Files, ru: 'Тест-кейсы', en: 'Test cases' },
  suites: { icon: Layers, ru: 'Тест-сьюты', en: 'Test suites' },
  defects: { icon: Bug, ru: 'Дефекты', en: 'Defects' },
  assignments: { icon: UserRoundCheck, ru: 'Назначения', en: 'Assignments' },
  integrations: { icon: Webhook, ru: 'Интеграции', en: 'Integrations' },
  access: { icon: ShieldCheck, ru: 'Доступ', en: 'Access' },
};
export function NotificationRow({ item, locale, workspaceId, pageUrl, onRead, onNavigate }: {
  item: NotificationItem; locale: 'ru' | 'en'; workspaceId: string; pageUrl: string;
  onRead: (id: string) => void; onNavigate: (href: string) => void;
}) {
  const category = categories[item.category] ?? { icon: Bell, ru: 'Falcon', en: 'Falcon' };
  const Icon = category.icon, href = notificationHref(item.url, pageUrl, workspaceId);
  const contents = <>
    <span className={css.eventIcon} data-kind={item.category} aria-hidden="true"><Icon size={21} strokeWidth={1.65}/></span>
    <span className={css.copy}>
      <strong>{item.title}</strong>
      {item.body && <span className={css.body}>{item.body}</span>}
      <span className={css.meta}><span>{category[locale]}</span><span aria-hidden="true">·</span>
        <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString(locale)}>{notificationTime(item.createdAt, locale)}</time></span>
    </span>
    {!item.read && <span className={css.unreadDot} role="img" aria-label={locale === 'ru' ? 'Не прочитано' : 'Unread'}/>}
  </>;
  return <li data-read={item.read} className={css.row}>
    {href ? <a href={href} className={css.event} onClick={event => {
      if (!item.read) onRead(item.id);
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
        event.preventDefault(); onNavigate(href);
      }
    }}>{contents}</a> : <div className={css.event}>{contents}</div>}
  </li>;
}
