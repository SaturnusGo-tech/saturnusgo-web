import type { RefObject } from 'react';
import { Bell, BrushCleaning, MailCheck, Settings2, X } from 'lucide-react';
import type { NotificationInboxState } from '../application/useNotificationInbox';
import { NotificationRow } from './NotificationRow';
import css from './inbox.module.css';

export function NotificationInbox({ panel, id, model: m, locale, workspaceId, pageUrl, fallback = false, onClose, onNavigate, onSettings }: {
  panel: RefObject<HTMLDivElement | null>; id: string; model: NotificationInboxState; locale: 'ru' | 'en';
  workspaceId: string; pageUrl: string; fallback?: boolean; onClose: () => void; onNavigate: (href: string) => void; onSettings: () => void;
}) {
  const ru = locale === 'ru';
  return <div ref={panel} id={id} popover={fallback ? undefined : "manual"} className={css.panel} role="dialog" aria-labelledby={`${id}-title`}>
    <header className={css.header}>
      <h2 id={`${id}-title`} tabIndex={-1}>{ru ? 'Уведомления' : 'Notifications'}</h2>
      <div className={css.actions}>
        <button type="button" title={ru ? 'Отметить все прочитанными' : 'Mark all read'} aria-label={ru ? 'Отметить все прочитанными' : 'Mark all read'}
          disabled={m.busy || !m.unreadCount} onClick={() => void m.readAll()}><MailCheck size={19}/></button>
        <button type="button" title={ru ? 'Убрать прочитанные' : 'Clear read'} aria-label={ru ? 'Убрать прочитанные' : 'Clear read'}
          disabled={m.busy || !m.items.some(item => item.read)} onClick={() => void m.archiveRead()}><BrushCleaning size={19}/></button>
        <button type="button" title={ru ? 'Настройки уведомлений' : 'Notification settings'} aria-label={ru ? 'Настройки уведомлений' : 'Notification settings'} onClick={onSettings}><Settings2 size={18}/></button>
        <button type="button" className={css.close} aria-label={ru ? 'Закрыть уведомления' : 'Close notifications'} onClick={onClose}><X size={18}/></button>
      </div>
    </header>
    <div className={css.scroll} aria-busy={m.loading}>
      {m.error && <div className={css.error} role="alert"><span>{ru ? 'Не удалось обновить уведомления.' : 'Notifications could not be updated.'}</span>
        <button type="button" onClick={() => void m.retry()} disabled={m.busy}>{ru ? 'Повторить' : 'Retry'}</button></div>}
      {m.loading ? <div className={css.skeleton} role="status" aria-label={ru ? 'Загрузка уведомлений' : 'Loading notifications'}><i/><i/><i/></div>
        : m.items.length ? <ol className={css.feed} aria-label={ru ? 'Входящие уведомления' : 'Notification inbox'}>
          {m.items.map(item => <NotificationRow key={item.id} item={item} locale={locale} workspaceId={workspaceId} pageUrl={pageUrl}
            onRead={id => void m.read(id)} onNavigate={onNavigate}/>)}</ol>
        : !m.error && <div className={css.empty}><Bell size={28} strokeWidth={1.25}/><h3>{ru ? 'Пока нет уведомлений' : 'No notifications yet'}</h3>
          <p>{ru ? 'Здесь появятся назначения, прогоны и другие события вашей команды.' : 'Assignments, test runs and other team activity will appear here.'}</p></div>}
      {m.next && <button className={css.more} type="button" disabled={m.busy} onClick={() => void m.more()}>{ru ? 'Показать ещё' : 'Show more'}</button>}
    </div>
  </div>;
}
