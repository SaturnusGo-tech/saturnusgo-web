import type { TmsLocale } from "../model/locale";

const labels: Record<string, readonly [string, string]> = {
  acceptance: ["Acceptance", "Приёмочный"],
  active: ["Active", "Активен"],
  ad_hoc: ["Ad hoc", "Разовый"],
  archived: ["Archived", "В архиве"],
  blocked: ["Blocked", "Заблокирован"],
  checklist: ["Checklist", "Чек-лист"],
  closed: ["Closed", "Закрыт"],
  completed: ["Completed", "Завершён"],
  critical: ["Critical", "Критический"],
  deprecated: ["Deprecated", "Устарел"],
  draft: ["Draft", "Черновик"],
  failed: ["Failed", "Провален"],
  high: ["High", "Высокий"],
  in_progress: ["In progress", "В процессе"],
  low: ["Low", "Низкий"],
  manual: ["Manual", "Ручной"],
  medium: ["Medium", "Средний"],
  not_run: ["Not run", "Не запущен"],
  open: ["Open", "Открыт"],
  passed: ["Passed", "Пройден"],
  quarantined: ["Quarantined", "На карантине"],
  ready: ["Ready", "Готов"],
  ready_for_retest: ["Ready for testing", "Готов к тестированию"],
  regression: ["Regression", "Регресс"],
  reopened: ["Reopened", "Переоткрыт"],
  skipped: ["Skipped", "Пропущен"],
  smoke: ["Smoke", "Смоук"],
  static: ["Static", "Статический"],
  dynamic: ["Dynamic", "Динамический"],
  verified: ["Verified", "Проверен"],
  triaged: ["Triaged", "Разобран"],
};

const russianComponentLabels: Record<string, string> = {
  About: "О приложении", Access: "Доступ", Accessibility: "Доступность",
  "Account Settings": "Настройки аккаунта", "Active Orders": "Активные заказы",
  Appearance: "Внешний вид", Archives: "Архивы", "Assignment Preferences": "Настройки назначений",
  Authentication: "Авторизация", Automation: "Автоматизация", "Automation Payments": "Автоматизация платежей",
  "Cleaning Preferences": "Настройки уборки", Contacts: "Контакты", "Core product": "Основной продукт",
  "Deep Links": "Диплинки", "Help Center": "Центр помощи", "Host Calendar": "Календарь хоста",
  "Host Dashboard": "Дашборд хоста", "Host Entry": "Вход хоста", "Host Menu": "Меню хоста",
  "Host Profile": "Профиль хоста", "Host Shell": "Оболочка хоста", Instructions: "Инструкции",
  "Laundry Preferences": "Настройки стирки", Legal: "Юридическая информация", "Local Protection": "Локальная защита",
  Localization: "Локализация", Messages: "Сообщения", Motion: "Анимации", Notifications: "Уведомления",
  "Order History": "История заказов", "Payment Methods": "Способы оплаты", "Private Media": "Приватные материалы",
  "Process Restoration": "Восстановление процесса", Properties: "Объекты", "Property Detail": "Карточка объекта",
  "Property Lifecycle": "Жизненный цикл объекта", "Property Settings": "Настройки объекта",
  "Property Setup": "Настройка объекта", "Service Launch Bridge": "Переход к запуску услуги",
  "Service Onboarding": "Онбординг услуги", "Service Preferences": "Настройки услуги", Support: "Поддержка",
  Templates: "Шаблоны", Translation: "Перевод", Units: "Помещения",
};

export const localizedLabel = (locale: TmsLocale, value: string) =>
  labels[value]?.[locale === "ru" ? 1 : 0] ?? value.replaceAll("_", " ");

export const localizedComponentLabel = (locale: TmsLocale, component: string) =>
  locale === "ru" ? russianComponentLabels[component] ?? component : component;
