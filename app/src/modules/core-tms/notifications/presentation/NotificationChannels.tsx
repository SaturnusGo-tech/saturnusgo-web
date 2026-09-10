import { Send, Monitor } from "lucide-react";
import type { NotificationsState } from "../application/useNotifications";
import styles from "./notifications.module.css";
export function NotificationChannels({
  model: m,
  ru,
}: {
  model: NotificationsState;
  ru: boolean;
}) {
  const s = m.settings;
  return (
    <ul
      className={styles.channels}
      aria-label={ru ? "Каналы уведомлений" : "Notification channels"}
    >
      <li className={styles.channel}>
        <div className={styles.channelIcon}>
          <Monitor size={19} strokeWidth={1.6} />
        </div>
        <div className={styles.channelText}>
          <h2>{ru ? "В браузере" : "In your browser"}</h2>
          <span className={styles.channelStatus}>
            {m.connected
              ? ru
                ? "Включены"
                : "Enabled"
              : ru
                ? "Выключены"
                : "Off"}
          </span>
          {m.permission === "denied" && (
            <small>
              {ru
                ? "Разрешите уведомления в настройках сайта в браузере."
                : "Allow notifications in your browser's site settings."}
            </small>
          )}
          {m.permission === "unsupported" && (
            <small>
              {ru
                ? "Этот браузер не поддерживает push-уведомления."
                : "This browser does not support push notifications."}
            </small>
          )}
          {!s?.vapidPublicKey && (
            <small>
              {ru
                ? "Канал ещё не настроен на сервере."
                : "This channel has not been configured yet."}
            </small>
          )}
        </div>
        <button
          className={m.connected ? styles.secondary : styles.primary}
          disabled={
            m.busy ||
            !s?.vapidPublicKey ||
            m.permission === "unsupported" ||
            m.permission === "denied"
          }
          onClick={() =>
            void (m.connected ? m.disableBrowser() : m.enableBrowser())
          }
        >
          {m.connected
            ? ru
              ? "Отключить"
              : "Disconnect"
            : ru
              ? "Включить"
              : "Enable"}
        </button>
      </li>
      <li className={styles.channel}>
        <div className={`${styles.channelIcon} ${styles.telegram}`}>
          <Send size={19} strokeWidth={1.6} />
        </div>
        <div className={styles.channelText}>
          <h2>Telegram</h2>
          <span className={styles.channelStatus}>
            {s?.telegramConnected
              ? ru
                ? "Подключён"
                : "Connected"
              : ru
                ? "Не подключён"
                : "Not connected"}
          </span>
          {!s?.telegramUsername && (
            <small>
              {ru
                ? "Бот ещё не подключён."
                : "The bot has not been connected yet."}
            </small>
          )}
          {m.telegramUrl && (
            <div className={styles.linkFlow}>
              <a href={m.telegramUrl} target="_blank" rel="noopener noreferrer">
                {ru ? "Открыть бота" : "Open bot"} ↗
              </a>
              <button
                disabled={m.busy}
                onClick={() => void m.refreshTelegram()}
              >
                {ru ? "Я нажал Start" : "I pressed Start"}
              </button>
            </div>
          )}
          {s?.pendingTelegram && (
            <div className={styles.pending}>
              <span>
                {ru ? "Подключить аккаунт" : "Connect account"}{" "}
                <strong>{s.pendingTelegram.name}</strong>?
              </span>
              <button
                disabled={m.busy}
                onClick={() => void m.confirmTelegram()}
              >
                {ru ? "Подтвердить" : "Confirm"}
              </button>
            </div>
          )}
        </div>
        {(!s?.pendingTelegram || s?.telegramConnected) && (
          <button
            className={s?.telegramConnected ? styles.secondary : styles.primary}
            disabled={m.busy || !s?.telegramUsername}
            onClick={() =>
              void (s?.telegramConnected
                ? m.disconnectTelegram()
                : m.linkTelegram())
            }
          >
            {s?.telegramConnected
              ? ru
                ? "Отключить"
                : "Disconnect"
              : m.telegramUrl
                ? ru
                  ? "Новая ссылка"
                  : "New link"
                : ru
                  ? "Подключить"
                  : "Connect"}
          </button>
        )}
      </li>
    </ul>
  );
}
