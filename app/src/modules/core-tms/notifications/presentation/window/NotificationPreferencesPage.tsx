import type { NotificationsState } from "../../application/useNotifications";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { TessiqLoader } from "../../../presentation/common/loading/TessiqLoader";
import { AdvancedEventFilters } from "../advanced/AdvancedEventFilters";
import styles from "./preferences-window.module.css";
export function NotificationPreferencesPage({ model, ru }: { model: NotificationsState; ru: boolean }) {
  return <main className={styles.page}>
    <header><h1>{ru ? "Дополнительные фильтры" : "Advanced filters"}</h1></header>
    <ErrorToast message={model.error === "conflict"
      ? (ru ? "Настройки изменились в другом окне. Загружена актуальная версия." : "Settings changed in another window. The latest version is loaded.")
      : model.error ? (ru ? "Не удалось обновить настройки уведомлений." : "Notification settings could not be updated.") : null}/>
    {model.loading ? <TessiqLoader branded label={ru ? "Загрузка настроек" : "Loading settings"}/>
      : model.settings ? <AdvancedEventFilters model={model} ru={ru}/>
      : <p role="status">{ru ? "Настройки недоступны. Закройте и снова откройте это окно." : "Settings are unavailable. Close and reopen this window."}</p>}
  </main>;
}
