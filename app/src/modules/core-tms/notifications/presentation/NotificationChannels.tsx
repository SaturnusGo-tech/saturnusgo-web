import { PreferenceSwitch } from "./controls/PreferenceSwitch";
import { TelegramConnection } from "./controls/TelegramConnection";
import { DesktopNotifications } from "./native/DesktopNotifications";
import type { NotificationsState } from "../application/useNotifications";
import styles from "./notifications.module.css";
export function NotificationChannels({ model: m, ru, desktop = false, workspaceId }: {
  model: NotificationsState; ru: boolean; desktop?: boolean; workspaceId?: string;
}) {
  const s = m.settings;
  const browserNotice = m.permission === "denied"
    ? (ru ? "Разрешите уведомления в настройках сайта в браузере." : "Allow notifications in your browser’s site settings.")
    : m.permission === "unsupported" ? (ru ? "Этот браузер не поддерживает push-уведомления." : "This browser does not support push notifications.")
    : !s?.vapidPublicKey ? (ru ? "Уведомления браузера пока недоступны." : "Browser notifications are not available yet.") : null;
  return <div className={styles.channels} aria-label={ru ? "Каналы уведомлений" : "Notification channels"}>
    <section className={styles.section} data-channel="telegram" aria-labelledby="notification-telegram-title">
      <div className={styles.sectionCopy}><h2 id="notification-telegram-title">{ru ? "Уведомления в Telegram" : "Telegram notifications"}</h2>
        <p>{ru ? "Получайте важные события рабочего пространства в личных сообщениях бота Falcon." : "Keep up with your workspace through private messages from the Falcon bot."}</p></div>
      <div className={styles.options}>
        <PreferenceSwitch label={ru ? "Получать в Telegram" : "Receive in Telegram"} selected={Boolean(s?.telegramConnected)}
          disabled={m.busy || !s?.telegramUsername || (!s?.telegramConnected && Boolean(m.telegramUrl || s?.pendingTelegram))}
          description={s?.telegramConnected ? (ru ? "Аккаунт подтверждён. Используются выбранные ниже события." : "Account confirmed. Uses your event preferences below.")
            : !s?.telegramUsername ? (ru ? "Канал пока недоступен." : "This channel is not available yet.")
            : (ru ? "Подключите бота и подтвердите свой Telegram-аккаунт в Falcon." : "Connect the bot and confirm your Telegram account in Falcon.")}
          onChange={() => void (s?.telegramConnected ? m.disconnectTelegram() : m.linkTelegram())}/>
        <TelegramConnection model={m} ru={ru}/>
      </div>
    </section>
    {!desktop && <section className={styles.section} data-channel="browser" aria-labelledby="notification-browser-title">
      <div className={styles.sectionCopy}><h2 id="notification-browser-title">{ru ? "Уведомления в браузере" : "Browser notifications"}</h2>
        <p>{ru ? "Получайте push-уведомления на этом устройстве, пока Falcon открыт в браузере или работает в фоне." : "Receive push notifications on this device while Falcon is open or running in the background."}</p></div>
      <div className={styles.options}><PreferenceSwitch label={ru ? "Получать в этом браузере" : "Receive on this browser"}
        description={browserNotice ?? (ru ? "Браузер запросит разрешение при включении." : "Your browser will ask for permission when you turn this on.")}
        selected={Boolean(m.connected)} disabled={m.busy || (!m.connected && Boolean(browserNotice))}
        onChange={() => void (m.connected ? m.disableBrowser() : m.enableBrowser())}/></div>
    </section>}
    {desktop && <DesktopNotifications ru={ru} workspaceId={workspaceId}/>}
    <section className={styles.section} data-channel="email" aria-labelledby="notification-email-title">
      <div className={styles.sectionCopy}><h2 id="notification-email-title">{ru ? "Уведомления по email" : "Email notifications"}</h2>
        <p>{ru ? "События Falcon в вашей почте." : "Workspace updates delivered to your inbox."}</p></div>
      <div className={styles.options}><PreferenceSwitch label={ru ? "Доставка по email" : "Email delivery"} selected={false} disabled
        description={ru ? "Пока недоступна. Этот канал появится в одном из следующих обновлений." : "Not available yet. This channel will be enabled in a future update."}/></div>
    </section>
  </div>;
}
