import { BellRing, Send, Monitor, Check } from "lucide-react";
import type { NotificationsState } from "../application/useNotifications";
import styles from "./notifications.module.css";
export function NotificationChannels({ model: m, ru }: { model: NotificationsState; ru: boolean }) {
  const s = m.settings;
  return (
    <div className={styles.channels}>
      <article className={styles.channel}>
        <div className={styles.channelIcon}>
          <Monitor size={24} strokeWidth={1.6} />
        </div>
        <div className={styles.channelText}>
          <h2>{ru ? "В браузере" : "In your browser"}</h2>
          <p>
            {ru
              ? "Узнавайте о новых событиях, пока работаете за компьютером."
              : "Stay informed while working on your computer."}
          </p>
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
              {ru ? "Канал ещё не настроен на сервере." : "This channel has not been configured yet."}
            </small>
          )}
        </div>
        <button
          className={m.connected ? styles.secondary : styles.primary}
          disabled={
            m.busy || !s?.vapidPublicKey || m.permission === "unsupported" || m.permission === "denied"
          }
          onClick={() => void (m.connected ? m.disableBrowser() : m.enableBrowser())}
        >
          {m.connected ? <Check size={16} /> : <BellRing size={16} />}{" "}
          {m.connected ? (ru ? "Отключить" : "Disconnect") : ru ? "Включить" : "Enable"}
        </button>
      </article>
      <article className={styles.channel}>
        <div className={`${styles.channelIcon} ${styles.telegram}`}>
          <Send size={24} strokeWidth={1.6} />
        </div>
        <div className={styles.channelText}>
          <h2>Telegram</h2>
          <p>
            {ru
              ? "Сообщения о проверках и исправлениях в личном чате с ботом Falcon."
              : "Checks and fixes delivered to your private chat with Falcon."}
          </p>
          {!s?.telegramUsername && (
            <small>{ru ? "Бот ещё не подключён." : "The bot has not been connected yet."}</small>
          )}
          {m.telegramUrl && (
            <div className={styles.linkFlow}>
              <a href={m.telegramUrl} target="_blank" rel="noopener noreferrer">
                {ru ? "Открыть бота" : "Open bot"} ↗
              </a>
              <button disabled={m.busy} onClick={() => void m.refreshTelegram()}>
                {ru ? "Я нажал Start" : "I pressed Start"}
              </button>
            </div>
          )}
          {s?.pendingTelegram && (
            <div className={styles.pending}>
              <span>
                {ru ? "Подключить аккаунт" : "Connect account"} <strong>{s.pendingTelegram.name}</strong>?
              </span>
              <button disabled={m.busy} onClick={() => void m.confirmTelegram()}>
                {ru ? "Подтвердить" : "Confirm"}
              </button>
            </div>
          )}
        </div>
        <button
          className={s?.telegramConnected ? styles.secondary : styles.primary}
          disabled={m.busy || !s?.telegramUsername}
          onClick={() => void (s?.telegramConnected ? m.disconnectTelegram() : m.linkTelegram())}
        >
          {s?.telegramConnected ? (ru ? "Отключить" : "Disconnect") : ru ? "Подключить" : "Connect"}
        </button>
      </article>
    </div>
  );
}
