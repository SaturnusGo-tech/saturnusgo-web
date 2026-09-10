import { Bell, Check, ArrowUpRight } from "lucide-react";
import type { NotificationsState } from "../application/useNotifications";
import type { NotificationCategory } from "../domain/notifications";
import { NotificationChannels } from "./NotificationChannels";
import styles from "./notifications.module.css";
const categories: readonly [NotificationCategory, string, string][] = [
  ["assignments", "Назначения", "Assignments"],
  ["runs", "Прогоны", "Runs"],
  ["defects", "Дефекты", "Defects"],
  ["cases", "Тест-кейсы", "Test cases"],
  ["suites", "Тест-сьюты", "Test suites"],
  ["integrations", "Интеграции", "Integrations"],
];
export function NotificationPage({
  model: m,
  ru,
  onOpen,
}: {
  model: NotificationsState;
  ru: boolean;
  onOpen?: (url: string) => void;
}) {
  return (
    <section className={styles.page} data-testid="notification-page">
      <header className={styles.header}>
        <h1>{ru ? "Уведомления" : "Notifications"}</h1>
      </header>
      {m.loading ? (
        <div
          className={styles.skeleton}
          aria-busy="true"
          aria-label={ru ? "Загрузка уведомлений" : "Loading notifications"}
        >
          <i />
          <i />
          <i />
        </div>
      ) : (
        <>
          {m.error && (
            <div className={styles.error} role="alert">
              <span>
                {m.error === "denied"
                  ? ru
                    ? "Браузер не разрешил уведомления."
                    : "Browser permission was not granted."
                  : ru
                    ? "Не удалось обновить уведомления."
                    : "Notifications could not be updated."}
              </span>
              <button onClick={() => void m.retry()} disabled={m.busy}>
                {ru ? "Повторить" : "Retry"}
              </button>
            </div>
          )}
          {m.settings && (
            <>
              <NotificationChannels model={m} ru={ru} />
              <div className={styles.preferences}>
                <h2>{ru ? "О чём сообщать" : "What to notify you about"}</h2>
                <div className={styles.categories}>
                  {categories.map(([id, ruLabel, enLabel]) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={m.settings!.categories.includes(id)}
                        disabled={m.busy}
                        onChange={(e) =>
                          void m.changeCategories(
                            e.target.checked
                              ? [...m.settings!.categories, id]
                              : m.settings!.categories.filter((c) => c !== id),
                          )
                        }
                      />
                      <span>{ru ? ruLabel : enLabel}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.feedHeader}>
                <h2>{ru ? "События" : "Activity"}</h2>
                <button onClick={() => void m.retry()} disabled={m.busy}>
                  {ru ? "Обновить" : "Refresh"}
                </button>
              </div>
              {m.items.length === 0 ? (
                <div className={styles.empty}>
                  <Bell size={20} strokeWidth={1.5} />
                  <h3>{ru ? "Новых событий пока нет" : "No new activity"}</h3>
                </div>
              ) : (
                <ol className={styles.feed}>
                  {m.items.map((item) => (
                    <li key={item.id} data-read={item.read}>
                      <span className={styles.eventIcon}>
                        {item.read ? <Check size={18} /> : <Bell size={18} />}
                      </span>
                      <div className={styles.eventContent}>
                        <a
                          href={item.url}
                          onClick={(event) => {
                            void m.markRead(item.id);
                            if (
                              onOpen &&
                              !event.metaKey &&
                              !event.ctrlKey &&
                              !event.shiftKey &&
                              event.button === 0
                            ) {
                              event.preventDefault();
                              onOpen(item.url);
                            }
                          }}
                        >
                          <strong>{item.title}</strong>
                          <ArrowUpRight size={15} />
                        </a>
                        {item.body && <p>{item.body}</p>}
                        <time dateTime={item.createdAt}>
                          {new Date(item.createdAt).toLocaleString(
                            ru ? "ru-RU" : "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </time>
                      </div>
                      {!item.read && (
                        <button
                          className={styles.readButton}
                          title={ru ? "Прочитано" : "Mark read"}
                          aria-label={ru ? "Отметить прочитанным" : "Mark read"}
                          disabled={m.busy}
                          onClick={() => void m.markRead(item.id)}
                        >
                          <Check size={17} />
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              {m.next && (
                <button
                  className={styles.more}
                  disabled={m.busy}
                  onClick={() => void m.more()}
                >
                  {ru ? "Показать ещё" : "Show more"}
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
