import { Button } from "@heroui/react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ErrorToast } from "../../presentation/common/error/ErrorToast";
import { TessiqLoader } from "../../presentation/common/loading/TessiqLoader";
import type { NotificationsState } from "../application/useNotifications";
import { NotificationChannels } from "./NotificationChannels";
import { EventPreferences } from "./events/EventPreferences";
import { NotificationFiltersDialog } from "./advanced/NotificationFiltersDialog";
import styles from "./notifications.module.css";
export function NotificationPage({ model: m, ru, embedded = false, desktop = false, workspaceId, onOpenAdvanced }: {
  model: NotificationsState; ru: boolean; embedded?: boolean; desktop?: boolean; workspaceId?: string; onOpenAdvanced?: () => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const error = m.error === "denied" ? (ru ? "Разрешите уведомления в настройках этого браузера." : "Allow notifications in this browser’s site settings.")
    : m.error === "conflict" ? (ru ? "Настройки изменились в другом окне. Загружена актуальная версия — проверьте свой выбор." : "Settings changed in another window. The latest version is loaded; review your choices.")
    : m.error === "load" ? (ru ? "Не удалось загрузить настройки уведомлений." : "Notification settings could not be loaded.")
    : m.error ? (ru ? "Не удалось сохранить настройки уведомлений." : "Notification settings could not be saved.") : null;
  return <section className={styles.page} data-testid="notification-page" data-embedded={embedded || undefined}>
    {!embedded && <header className={styles.header}><h1>{ru ? "Настройки уведомлений" : "Notification settings"}</h1>
      <p>{ru ? "Выберите, какие уведомления получать о работе команды и ваших задачах." : "Choose the notifications you receive about your work and your team."}</p></header>}
    <ErrorToast message={error}/>
    {m.loading ? <div className={styles.loading}><TessiqLoader branded label={ru ? "Загрузка настроек" : "Loading settings"}/></div> : m.settings ? <>
      <NotificationChannels model={m} ru={ru} desktop={desktop} workspaceId={workspaceId}/>
      <EventPreferences model={m} ru={ru}/>
      <Button variant="light" disableRipple className={styles.advanced} onPress={() => onOpenAdvanced ? onOpenAdvanced() : setAdvanced(true)}>
        <SlidersHorizontal size={21} strokeWidth={1.6} aria-hidden="true"/>
        <span><strong>{ru ? "Дополнительные фильтры" : "Advanced filters"}</strong>
          <small>{ru ? "Уточните события, о которых хотите знать, — и отключите остальные." : "Fine-tune the events you’d like to hear about — and those you don’t."}</small></span>
        <ChevronRight size={19} aria-hidden="true"/>
      </Button>
      {advanced && <NotificationFiltersDialog model={m} ru={ru} onClose={() => setAdvanced(false)}/>}
    </> : <p className={styles.unavailable} role="status">{ru ? "Настройки сейчас недоступны. Откройте этот раздел ещё раз." : "Settings are unavailable. Open this section again to reload."}</p>}
  </section>;
}
