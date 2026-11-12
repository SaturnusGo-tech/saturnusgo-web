import type { NotificationCategory } from "../../domain/notifications";
type CategoryCopy = { id: NotificationCategory; en: string; ru: string; enHint: string; ruHint: string };
export const notificationCategories: readonly CategoryCopy[] = [
  { id: "assignments", en: "Assignments", ru: "Назначения", enHint: "Work assigned to you and changes to your responsibilities.", ruHint: "Новые задачи и изменения ваших назначений." },
  { id: "runs", en: "Test runs", ru: "Прогоны", enHint: "Run results, retests and updates to test execution.", ruHint: "Результаты прогонов, перепроверки и ход тестирования." },
  { id: "defects", en: "Defects and mentions", ru: "Дефекты и упоминания", enHint: "Defect updates, comments and mentions that need your attention.", ruHint: "Изменения дефектов, комментарии и упоминания, требующие внимания." },
  { id: "cases", en: "Test cases", ru: "Тест-кейсы", enHint: "New cases, revisions, archives and mentions.", ruHint: "Новые кейсы, изменения, архивирование и упоминания." },
  { id: "suites", en: "Test suites", ru: "Тест-сьюты", enHint: "Changes to the suites you use for testing.", ruHint: "Изменения тест-сьютов, которые вы используете в работе." },
  { id: "integrations", en: "Integrations", ru: "Интеграции", enHint: "Connection updates and delivery issues with connected services.", ruHint: "Состояние подключений и ошибки доставки в связанные сервисы." },
  { id: "access", en: "Workspace and account", ru: "Рабочее пространство и аккаунт", enHint: "Role changes, workspace access and achievements.", ruHint: "Изменения ролей, доступа и достижения." },
];
