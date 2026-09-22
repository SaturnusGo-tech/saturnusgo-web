const labels: Record<string, readonly [string, string]> = {
  "case_import.file.saved": ["Сохранён исходный файл импорта", "Import source file saved"],
  "attachment.read_grant.issued": ["Разрешён доступ к вложению", "Attachment access authorized"],
  "attachment.read_grant.denied": ["Доступ к вложению отклонён", "Attachment access denied"],
  "attachment.upload_intent.created": ["Подготовлена загрузка вложения", "Attachment upload prepared"],
  "attachment.upload.finalized": ["Добавлено вложение", "Attachment added"],
  "attachment.uploaded": ["Добавлено вложение", "Attachment added"],
  "attachment.created": ["Добавлено вложение", "Attachment added"],
  "attachment.deleted": ["Удалено вложение", "Attachment deleted"],
  "attachment.cleanup.deleted": ["Удалён неиспользуемый файл", "Unused file cleaned up"],
  "attachment.cleanup.claimed": ["Начата очистка вложений", "Attachment cleanup started"],
  "attachment.cleanup.reclaimed": ["Возобновлена очистка вложений", "Attachment cleanup resumed"],
  "attachment.cleanup.retry_scheduled": ["Запланирована повторная очистка", "Cleanup retry scheduled"],
  "attachment.upload.expired": ["Истекло время загрузки вложения", "Attachment upload expired"],
  "attachment.lifecycle.changed": ["Обновлено состояние вложения", "Attachment state updated"],
  "test_case.folder_moved": ["Тест-кейс перемещён в другую папку", "Test case moved to another folder"],
  "test_case.folder_relocated": ["Изменено расположение тест-кейса", "Test case location updated"],
  "test_case.assigned": ["Назначен ответственный за тест-кейс", "Test case assignee changed"],
  "project.assigned": ["Назначен ответственный за проект", "Project owner changed"],
  "portfolio.assigned": ["Назначен ответственный за портфель", "Portfolio owner changed"],
  "run.assigned": ["Назначен ответственный за прогон", "Test run assignee changed"],
  "run_item.assigned": ["Назначен исполнитель кейса в прогоне", "Run case assignee changed"],
  "run_item.retest_started": ["Начата повторная проверка кейса", "Case retest started"],
  "suite.resolved": ["Определён состав тест-сьюта", "Test suite cases resolved"],
  "access.verify_mfa": ["Подтверждён вход с двухфакторной защитой", "Two-step sign-in verified"],
  "shared_step.revised": ["Обновлены общие шаги", "Shared steps updated"],
  "defect.assigned": ["Назначен исполнитель дефекта", "Defect assignee changed"],
  "defect.fix_confirmed": ["Подтверждено исправление дефекта", "Defect fix verified"],
  "integration.youtrack.synced": ["Синхронизирован дефект с YouTrack", "Defect synced with YouTrack"],
  "integration.youtrack.received": ["Получено обновление из YouTrack", "Update received from YouTrack"],
  "integration.youtrack.configuration_created": ["Подключён YouTrack", "YouTrack connected"],
  "integration.youtrack.configuration_updated": ["Обновлены настройки YouTrack", "YouTrack settings updated"],
  "integration.youtrack.disconnected": ["Отключён YouTrack", "YouTrack disconnected"],
};
const subjects: Record<string, readonly [string, string]> = {
  portfolio: ["портфеля", "portfolio"], project: ["проекта", "project"],
  repository_folder: ["папки", "folder"], dashboard: ["дашборда", "dashboard"],
  shared_step: ["общего шага", "shared step"], environment: ["окружения", "environment"],
  suite: ["тест-сьюта", "test suite"], run: ["прогона", "test run"],
};
const verbs: Record<string, readonly [string, string]> = {
  create: ["Создание", "Created"], created: ["Создание", "Created"],
  update: ["Изменение", "Updated"], updated: ["Изменение", "Updated"],
  archive: ["Архивация", "Archived"], archived: ["Архивация", "Archived"],
  restore: ["Восстановление", "Restored"], restored: ["Восстановление", "Restored"],
  delete: ["Удаление", "Deleted"], deleted: ["Удаление", "Deleted"],
};
export function productEventLabel(action: string, locale: "ru" | "en"): string | undefined {
  const i = locale === "ru" ? 0 : 1;
  if (labels[action]) return labels[action][i];
  const [subject, verb, extra] = action.split(".");
  return !extra && subjects[subject] && verbs[verb] ? `${verbs[verb][i]} ${subjects[subject][i]}` : undefined;
}
