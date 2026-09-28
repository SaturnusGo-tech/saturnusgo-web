import { useEffect, useId, useState } from "react";
import { Send, AppWindow, ArrowUpRight, ChevronDown } from "lucide-react";
import type { NotificationsState } from "../application/useNotifications";
import styles from "./notifications.module.css";

export function NotificationChannels({ model: m, ru }: { model: NotificationsState; ru: boolean }) {
  const id = useId();
  const s = m.settings;
  const [browserExpanded, setBrowserExpanded] = useState(false);
  const [telegramExpanded, setTelegramExpanded] = useState(Boolean(m.telegramUrl || s?.pendingTelegram));
  const pendingTelegramName = s?.pendingTelegram?.name;
  useEffect(() => {
    if (m.telegramUrl || pendingTelegramName !== undefined) setTelegramExpanded(true);
  }, [m.telegramUrl, pendingTelegramName]);
  const browserNotice = m.permission === "denied"
    ? ru ? "Разрешите уведомления в настройках сайта в браузере." : "Allow notifications in your browser's site settings."
    : m.permission === "unsupported"
      ? ru ? "Этот браузер не поддерживает push-уведомления." : "This browser does not support push notifications."
      : !s?.vapidPublicKey
        ? ru ? "Канал ещё не настроен на сервере." : "This channel has not been configured yet."
        : null;
  return (
    <ul className={styles.channels} aria-label={ru ? "Каналы уведомлений" : "Notification channels"}>
      <li className={styles.section}>
        <div className={styles.channelHeader}>
          <h2>
            <button type="button" className={`${styles.accordionTrigger} ${styles.channelTrigger}`}
              id={`${id}-browser-title`} aria-expanded={browserExpanded} aria-controls={`${id}-browser`}
              onClick={() => setBrowserExpanded((value) => !value)}>
              <AppWindow className={styles.channelIcon} size={18} strokeWidth={1.7} aria-hidden="true" />
              <span className={styles.sectionCopy}>
                <span className={styles.sectionTitle}>{ru ? "Уведомления в браузере" : "Browser notifications"}</span>
                <span className={styles.sectionDescription}>{ru ? "Получайте уведомления в этом браузере." : "Receive notifications in this browser."}</span>
              </span>
              <ChevronDown className={styles.chevron} size={20} aria-hidden="true" />
            </button>
          </h2>
          <div className={styles.channelActions}>
            <label className={styles.switchControl}>
              <input type="checkbox" role="switch" className={styles.switchInput}
                aria-label={ru ? "Уведомления в браузере" : "Browser notifications"}
                aria-describedby={browserNotice ? `${id}-browser-notice` : undefined}
                checked={Boolean(m.connected)}
                disabled={m.busy || (!m.connected && (!s?.vapidPublicKey || m.permission === "unsupported" || m.permission === "denied"))}
                onChange={() => void (m.connected ? m.disableBrowser() : m.enableBrowser())} />
              <span className={styles.switchTrack} aria-hidden="true" />
            </label>
          </div>
        </div>
        {browserNotice && <p className={styles.channelNotice} id={`${id}-browser-notice`}>{browserNotice}</p>}
        <div className={styles.sectionBody} id={`${id}-browser`} hidden={!browserExpanded}>
          <p className={styles.connectionStatus}>{m.connected
            ? ru ? "Уведомления включены в этом браузере." : "Notifications are enabled in this browser."
            : ru ? "Уведомления выключены в этом браузере." : "Notifications are off in this browser."}</p>
          {!m.connected && !browserNotice && <p className={styles.helpNote}>{ru ? "Включите уведомления и разрешите их в браузере." : "Turn on notifications and allow them when your browser asks."}</p>}
        </div>
      </li>
      <li className={styles.section}>
        <div className={styles.channelHeader}>
          <h2>
            <button type="button" className={`${styles.accordionTrigger} ${styles.channelTrigger}`}
              id={`${id}-telegram-title`} aria-expanded={telegramExpanded} aria-controls={`${id}-telegram`}
              onClick={() => setTelegramExpanded((value) => !value)}>
              <Send className={styles.channelIcon} size={18} strokeWidth={1.7} aria-hidden="true" />
              <span className={styles.sectionCopy}>
                <span className={styles.sectionTitle}>Telegram</span>
                <span className={styles.sectionDescription}>{ru ? "Получайте уведомления Falcon в Telegram." : "Receive Falcon notifications in Telegram."}</span>
              </span>
              <ChevronDown className={styles.chevron} size={20} aria-hidden="true" />
            </button>
          </h2>
          <div className={styles.channelActions}>
            {(!s?.pendingTelegram || s?.telegramConnected) && (
              <button type="button" className={styles.connectionButton} disabled={m.busy || !s?.telegramUsername}
                aria-describedby={!s?.telegramUsername ? `${id}-telegram-notice` : undefined}
                onClick={() => {
                  if (!s?.telegramConnected) setTelegramExpanded(true);
                  void (s?.telegramConnected ? m.disconnectTelegram() : m.linkTelegram());
                }}>
                {s?.telegramConnected
                  ? ru ? "Отключить" : "Disconnect"
                  : m.telegramUrl ? ru ? "Новая ссылка" : "New link" : ru ? "Подключить" : "Connect"}
              </button>
            )}
          </div>
        </div>
        {!s?.telegramUsername && <p className={styles.channelNotice} id={`${id}-telegram-notice`}>{ru ? "Бот ещё не подключён." : "The bot has not been connected yet."}</p>}
        <div className={styles.sectionBody} id={`${id}-telegram`} hidden={!telegramExpanded}>
          <p className={styles.connectionStatus}>{s?.telegramConnected
            ? ru ? "Telegram подключён." : "Telegram is connected."
            : ru ? "Telegram не подключён." : "Telegram is not connected."}</p>
          {m.telegramUrl && (
            <div className={styles.linkFlow}>
              <p>{ru ? "Откройте бота, нажмите Start и вернитесь, чтобы подтвердить подключение." : "Open the bot, press Start, then return to confirm the connection."}</p>
              <a className={styles.connectionButton} href={m.telegramUrl} target="_blank" rel="noopener noreferrer">{ru ? "Открыть бота" : "Open bot"}<ArrowUpRight size={15} aria-hidden="true" /></a>
              <button type="button" className={styles.connectionButton} disabled={m.busy} onClick={() => void m.refreshTelegram()}>{ru ? "Я нажал Start" : "I pressed Start"}</button>
            </div>
          )}
          {s?.pendingTelegram && (
            <div className={styles.pending} role="status">
              <span>{ru ? "Подключить аккаунт" : "Connect account"} <strong>{s.pendingTelegram.name}</strong>?</span>
              <button type="button" className={styles.connectionButton} disabled={m.busy} onClick={() => void m.confirmTelegram()}>{ru ? "Подтвердить" : "Confirm"}</button>
            </div>
          )}
        </div>
      </li>
    </ul>
  );
}
