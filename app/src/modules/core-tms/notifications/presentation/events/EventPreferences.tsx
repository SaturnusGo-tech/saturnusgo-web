import type { NotificationsState } from "../../application/useNotifications";
import { PreferenceSwitch } from "../controls/PreferenceSwitch";
import { notificationCategories } from "./category-copy";
import styles from "../notifications.module.css";
export function EventPreferences({ model: m, ru }: { model: NotificationsState; ru: boolean }) {
  const settings = m.settings;
  if (!settings) return null;
  return <section className={styles.section} aria-labelledby="notification-event-title">
    <div className={styles.sectionCopy}>
      <h2 id="notification-event-title">{ru ? "Настройки событий" : "Event preferences"}</h2>
      <p>{ru ? "Выберите, о чём сообщать в Telegram и подключённых браузерах. Эти настройки не меняют список входящих Falcon." : "Choose what reaches Telegram and your connected browsers. These settings do not change your Falcon inbox."}</p>
    </div>
    <div className={styles.options}>
      {notificationCategories.map(category => <PreferenceSwitch key={category.id} label={ru ? category.ru : category.en}
        description={category.id === "integrations" ? (ru ? "Доставка личных уведомлений об интеграциях пока недоступна." : "Personal integration notifications are not available yet.") : (ru ? category.ruHint : category.enHint)} selected={settings.categories.includes(category.id)} disabled={m.busy || category.id === "integrations"}
        recommended={category.id === "assignments" ? (ru ? "Рекомендуется" : "Recommended") : undefined}
        onChange={selected => void m.changeCategories(selected ? [...settings.categories, category.id]
          : settings.categories.filter(value => value !== category.id))}/>)}
    </div>
  </section>;
}
