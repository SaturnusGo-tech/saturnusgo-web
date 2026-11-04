import { useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from '@openai/apps-sdk-ui/components/Icon';
import { useTmsHttpClient } from '../../../auth/http/TmsHttpClientContext';
import { useTmsLocale } from '../../../localization/context/useTmsLocale';
import { notificationInboxClient } from '../../data/inbox-client';
import { visitWorkspace } from '../../../state/navigation/browser/workspace-history';
import { useNotificationInbox } from '../application/useNotificationInbox';
import { useInboxRefresh } from '../application/useInboxRefresh';
import { useNativeAchievements } from '../native/useNativeAchievements';
import { useInboxPopup } from '../presentation/popup/useInboxPopup';
import { NotificationInbox } from '../presentation/NotificationInbox';
import { notificationSettingsHref } from '../model/presentation';
import css from '../presentation/inbox.module.css';

export function NotificationBell({ workspaceId, connected, navigationClasses }: {
  workspaceId: string; connected: boolean; navigationClasses: { button: string; icon: string; label: string };
}) {
  const http = useTmsHttpClient(), { locale } = useTmsLocale(), id = useId();
  const client = useMemo(() => notificationInboxClient(http, workspaceId, locale), [http, workspaceId, locale]);
  const model = useNotificationInbox(client, connected), popup = useInboxPopup();
  useNativeAchievements(workspaceId, model.items, connected && !model.loading && !model.error);
  const ru = locale === 'ru', label = ru ? 'Уведомления' : 'Notifications';
  useInboxRefresh(client, connected, popup.open, model.refresh, popup.dismiss);
  const navigate = (href: string) => { popup.dismiss(); visitWorkspace(href); };
  const settings = () => navigate(notificationSettingsHref(window.location.href, workspaceId));
  const content = popup.open && <NotificationInbox panel={popup.panel} id={id} model={model} locale={locale} workspaceId={workspaceId} pageUrl={window.location.href}
    fallback={Boolean(popup.portalHost)} onClose={popup.close} onNavigate={navigate} onSettings={settings}/>;
  return <div className={css.root} ref={popup.root}>
    <button ref={popup.trigger} type="button" className={navigationClasses.button} data-active={popup.open} onClick={popup.toggle} disabled={!connected}
      aria-label={model.unreadCount ? `${label}, ${model.unreadCount} ${ru ? 'не прочитано' : 'unread'}` : label}
      data-nav-label={label} aria-haspopup="dialog" aria-expanded={popup.open} aria-controls={popup.open ? id : undefined} data-testid="nav-notifications">
      <span className={navigationClasses.icon} aria-hidden="true"><Bell width={24} height={24}/>{model.unreadCount > 0 && <i className={css.badge}/>}</span>
      <span className={navigationClasses.label}>{label}</span>
    </button>
    {popup.portalHost && content ? createPortal(content, popup.portalHost) : content}
  </div>;
}
