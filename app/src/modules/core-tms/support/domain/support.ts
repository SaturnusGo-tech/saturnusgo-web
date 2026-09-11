import type { components } from "../../../../core/tms/generated/tms-api";
export type SupportInput = components["schemas"]["SupportInput"];
export type SupportReceipt = components["schemas"]["SupportReceipt"];
export type SupportFile = { id: string; file: File };
export const topics = [
  ["access", "Доступ и сотрудники", "Access and team"], ["cases", "Тест-кейсы и репозиторий", "Test cases and repository"],
  ["runs", "Прогоны и тест-сьюты", "Runs and test suites"], ["defects", "Баг-репорты", "Bug reports"],
  ["projects", "Проекты и портфели", "Projects and portfolios"], ["integrations", "Интеграции и API", "Integrations and API"],
  ["attachments", "Файлы и изображения", "Files and images"], ["notifications", "Уведомления", "Notifications"],
  ["billing", "Условия использования", "Account and subscription"], ["other", "Другое", "Other"],
] as const;
export const fileTypes: Record<string, SupportInput["files"][number]["mime"]> = {
  png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", webp:"image/webp", gif:"image/gif", pdf:"application/pdf",
  txt:"text/plain", log:"text/plain", json:"application/json", csv:"text/csv", zip:"application/zip",
};
