import { useId, useState } from "react";
import { Bell, Check, ArrowUpRight, ChevronDown } from "lucide-react";
import type { NotificationsState } from "../application/useNotifications";
import type { NotificationCategory } from "../domain/notifications";
import { NotificationChannels } from "./NotificationChannels";
import styles from "./notifications.module.css";

const categoryGroups: readonly {
  id: string;
  ruLabel: string;
  enLabel: string;
  categories: readonly [NotificationCategory, string, string][];
}[] = [
  {
    id: "testing", ruLabel: "Тестирование", enLabel: "Testing",
    categories: [["runs", "Прогоны", "Test runs"], ["cases", "Тест-кейсы", "Test cases"], ["suites", "Тест-сьюты", "Test suites"]],
  },
  {
    id: "workflow", ruLabel: "Рабочий процесс", enLabel: "Workflow",
    categories: [["assignments", "Назначения", "Assignments"], ["defects", "Дефекты", "Defects"], ["integrations", "Интеграции", "Integrations"]],
  },
];

export function NotificationPage({ model: m, ru, onOpen }: {
  model: NotificationsState;
  ru: boolean;
  onOpen?: (url: string) => void;
}) {
  const id = useId();
  const [preferencesExpanded, setPreferencesExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(true);
  const settings = m.settings;
  return (
    <section className={styles.page} data-testid="notification-page">
      <header className={styles.header}>
        <h1>{ru ? "Уведомления" : "Notifications"}</h1>
        <p>{ru ? "Выберите, какие события Falcon получать и где." : "Choose which Falcon events to receive and where."}</p>
      </header>
      {m.loading ? (
        <div className={styles.skeleton} role="status" aria-busy="true" aria-label={ru ? "Загрузка уведомлений" : "Loading notifications"}>
          <i /><i /><i />
        </div>
      ) : (
        <>
          {m.error && (
            <div className={styles.error} role="alert">
              <span>
                {m.error === "denied"
                  ? ru ? "Браузер не разрешил уведомления." : "Browser permission was not granted."
                  : m.error === "load"
                    ? ru ? "Не удалось загрузить уведомления." : "Notifications could not be loaded."
                    : ru ? "Не удалось обновить уведомления." : "Notifications could not be updated."}
              </span>
              <button type="button" onClick={() => void m.retry()} disabled={m.busy}>{ru ? "Повторить" : "Retry"}</button>
            </div>
          )}
          {settings && (
            <>
              <NotificationChannels model={m} ru={ru} />
              <section className={styles.section} aria-labelledby={`${id}-preferences-title`}>
                <h2>
                  <button type="button" className={styles.accordionTrigger} id={`${id}-preferences-title`}
                    aria-expanded={preferencesExpanded} aria-controls={`${id}-preferences`}
                    onClick={() => setPreferencesExpanded((value) => !value)}>
                    <span className={styles.sectionCopy}>
                      <span className={styles.sectionTitle}>{ru ? "Настройки событий" : "Event preferences"}</span>
                      <span className={styles.sectionDescription}>{ru ? "Выберите события, о которых хотите узнавать." : "Choose the events you want to hear about."}</span>
                    </span>
                    <span className={styles.enabledCount}>{settings.categories.length} {ru ? "включено" : "enabled"}</span>
                    <ChevronDown className={styles.chevron} size={20} aria-hidden="true" />
                  </button>
                </h2>
                <div className={styles.sectionBody} id={`${id}-preferences`} hidden={!preferencesExpanded}>
                  <div className={styles.categoryGroups}>
                    {categoryGroups.map((group) => (
                      <fieldset className={styles.categoryGroup} key={group.id}>
                        <legend>{ru ? group.ruLabel : group.enLabel}</legend>
                        <div className={styles.categories}>
                          {group.categories.map(([category, ruLabel, enLabel]) => (
                            <label className={styles.category} key={category}>
                              <span>{ru ? ruLabel : enLabel}</span>
                              <span className={styles.switchControl}>
                                <input type="checkbox" role="switch" className={styles.switchInput}
                                  checked={settings.categories.includes(category)} disabled={m.busy}
                                  onChange={(event) => void m.changeCategories(event.target.checked
                                    ? [...settings.categories, category]
                                    : settings.categories.filter((value) => value !== category))} />
                                <span className={styles.switchTrack} aria-hidden="true" />
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                  <p className={styles.helpNote}>{ru ? "Применяется к Telegram и подключённым браузерам." : "Applies to Telegram and connected browsers."}</p>
                </div>
              </section>
              <section className={styles.section} aria-labelledby={`${id}-activity-title`}>
                <h2>
                  <button type="button" className={styles.accordionTrigger} id={`${id}-activity-title`}
                    aria-expanded={activityExpanded} aria-controls={`${id}-activity`}
                    onClick={() => setActivityExpanded((value) => !value)}>
                    <span className={styles.sectionCopy}>
                      <span className={styles.sectionTitle}>{ru ? "Последние события" : "Recent activity"}</span>
                      <span className={styles.sectionDescription}>{ru ? "Ваши последние назначения, прогоны и обновления дефектов." : "Your latest assignments, test runs and defect updates."}</span>
                    </span>
                    <ChevronDown className={styles.chevron} size={20} aria-hidden="true" />
                  </button>
                </h2>
                <div className={styles.sectionBody} id={`${id}-activity`} hidden={!activityExpanded}>
                  <div className={styles.feedHeader}>
                    <span>{ru ? "Входящие" : "Inbox"}</span>
                    <button type="button" onClick={() => void m.retry()} disabled={m.busy}>{ru ? "Обновить" : "Refresh"}</button>
                  </div>
                  {m.items.length === 0 ? (
                    <div className={styles.empty} role="status">
                      <Bell size={22} strokeWidth={1.5} aria-hidden="true" />
                      <h3>{ru ? "Новых событий пока нет" : "No new activity"}</h3>
                    </div>
                  ) : (
                    <ol className={styles.feed} aria-label={ru ? "Последние события" : "Recent activity"}>
                      {m.items.map((item) => (
                        <li key={item.id} data-read={item.read}>
                          <span className={styles.eventIcon} aria-hidden="true">{item.read ? <Check size={18} /> : <Bell size={18} />}</span>
                          <div className={styles.eventContent}>
                            <a href={item.url} onClick={(event) => {
                              void m.markRead(item.id);
                              if (onOpen && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
                                event.preventDefault();
                                onOpen(item.url);
                              }
                            }}>
                              <strong>{item.title}</strong><ArrowUpRight size={15} aria-hidden="true" />
                            </a>
                            {item.body && <p>{item.body}</p>}
                            <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                          </div>
                          {!item.read && (
                            <button type="button" className={styles.readButton} title={ru ? "Прочитано" : "Mark read"}
                              aria-label={`${ru ? "Отметить прочитанным" : "Mark read"}: ${item.title}`}
                              disabled={m.busy} onClick={() => void m.markRead(item.id)}>
                              <Check size={17} aria-hidden="true" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                  {m.next && <button type="button" className={styles.more} disabled={m.busy} onClick={() => void m.more()}>{ru ? "Показать ещё" : "Show more"}</button>}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
}
