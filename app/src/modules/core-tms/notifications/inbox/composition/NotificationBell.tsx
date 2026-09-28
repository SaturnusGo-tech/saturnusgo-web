import { useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useTmsHttpClient } from '../../../auth/http/TmsHttpClientContext';
import { useTmsLocale } from '../../../localization/context/useTmsLocale';
import { notificationInboxClient } from '../../data/inbox-client';
import { visitWorkspace } from '../../../state/navigation/browser/workspace-history';
import { useNotificationInbox } from '../application/useNotificationInbox';
import { useInboxPopup } from '../presentation/popup/useInboxPopup';
import { NotificationInbox } from '../presentation/NotificationInbox';
import css from '../presentation/inbox.module.css';

export function NotificationBell({ workspaceId, connected, navigationClasses }: {
  workspaceId: string; connected: boolean; navigationClasses: { button: string; icon: string; label: string };
}) {
  const http = useTmsHttpClient(), { locale } = useTmsLocale(), id = useId();
  const client = useMemo(() => notificationInboxClient(http, workspaceId, locale), [http, workspaceId, locale]);
  const model = useNotificationInbox(client, connected), popup = useInboxPopup();
  const ru = locale === 'ru', label = ru ? 'Уведомления' : 'Notifications';
  useEffect(() => {
    if (!connected) { popup.dismiss(); return; }
    if (popup.open) void model.refresh();
    const refresh = () => { if (document.visibilityState === 'visible') void model.refresh(!popup.open); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
    // The client/scope and popup state own refresh lifetime, not every resource update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, connected, popup.open]);
  const navigate = (href: string) => { popup.dismiss(); visitWorkspace(href); };
  const settings = () => {
    const url = new URL('/testcases/umbrella-home/work/', window.location.origin);
    url.searchParams.set('workspaceId', workspaceId); url.searchParams.set('view', 'config'); url.searchParams.set('settings', 'notifications');
    const project = new URLSearchParams(window.location.search).get('projectId'); if (project) url.searchParams.set('projectId', project);
    navigate(url.href);
  };
  const content = popup.open && <NotificationInbox panel={popup.panel} id={id} model={model} locale={locale} workspaceId={workspaceId} pageUrl={window.location.href}
    fallback={Boolean(popup.portalHost)} onClose={popup.close} onNavigate={navigate} onSettings={settings}/>;
  return <div className={css.root} ref={popup.root}>
    <button ref={popup.trigger} type="button" className={navigationClasses.button} data-active={popup.open} onClick={popup.toggle} disabled={!connected}
      aria-label={model.unreadCount ? `${label}, ${model.unreadCount} ${ru ? 'не прочитано' : 'unread'}` : label}
      data-nav-label={label} aria-haspopup="dialog" aria-expanded={popup.open} aria-controls={popup.open ? id : undefined} data-testid="nav-notifications">
      <span className={navigationClasses.icon} aria-hidden="true"><Bell size={20}/>{model.unreadCount > 0 && <i className={css.badge}/>}</span>
      <span className={navigationClasses.label}>{label}</span>
    </button>
    {popup.portalHost && content ? createPortal(content, popup.portalHost) : content}
  </div>;
}
