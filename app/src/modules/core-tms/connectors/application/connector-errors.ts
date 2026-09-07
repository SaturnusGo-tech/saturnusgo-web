import { TmsApiError } from "../../../../core/tms/transport/http";
import { connectorFailureLabel } from "../localization/connector-failure-copy";
export const connectorError = (error: unknown, russian: boolean): string => {
  const text: Record<string, [string, string]> = {
    ENCRYPTION_KEY_REQUIRED: ["На сервере ещё не настроено шифрование ключей интеграций.", "Integration credential encryption is not configured on the server."],
    UPSTREAM_ACCESS_DENIED: ["Сервис отклонил доступ. Проверьте ключ и его права.", "The service denied access. Check the token and its permissions."],
    UPSTREAM_RATE_LIMITED: ["Сервис ограничил частоту запросов. Повторите позже.", "The service rate limit was reached. Try again later."],
    UPSTREAM_UNAVAILABLE: ["Сервис временно недоступен. Настройки не изменены.", "The service is unavailable. Settings were not changed."],
    REMOTE_NOT_FOUND: ["Указанный ресурс не найден или недоступен этому ключу.", "The resource was not found or is unavailable to this token."],
    BOT_CHANNEL_MEMBERSHIP_REQUIRED: ["Сначала добавьте бота в выбранный канал Slack.", "Add the bot to the selected Slack channel first."],
    PRECONDITION_FAILED: ["Настройки уже изменились. Обновите экран перед сохранением.", "Settings have changed. Refresh before saving."],
    CONNECTION_BUSY: ["Сейчас обрабатывается событие. Сохраните настройки после его завершения.", "An event is processing. Save after it finishes."],
    CONNECTION_DISABLED: ["Подключение приостановлено. Включите его перед обновлением отчёта.", "The connection is paused. Enable it before republishing the report."],
    REPORT_DELIVERY_BUSY: ["Предыдущая доставка отчёта ещё не завершена или требует восстановления. Проверьте её статус в журнале.", "An earlier report delivery is unfinished or needs recovery. Review its status in the activity log."],
    RUN_NOT_COMPLETED: ["Отчёт можно обновить после завершения тест-рана.", "Complete the test run before republishing its report."],
    RUN_NOT_FOUND: ["Тест-ран не найден в этом проекте.", "The test run was not found in this project."],
    REPORT_NOT_LINKED: ["Для этого тест-рана ещё нет связанной страницы Confluence.", "This test run does not have a linked Confluence page yet."],
    CONNECTION_BINDING_IMMUTABLE: ["Для смены проекта сервиса сначала отсоедините текущее подключение.", "Disconnect the current connection before changing its remote resource."],
    SIGNING_SECRET_REQUIRED: ["Укажите секрет подписи вебхуков, не короче 32 символов.", "Enter a webhook signing secret of at least 32 characters."],
    RUN_RULE_REQUIRED: ["Добавьте правило выбора набора тестов и окружения.", "Add a rule selecting a test suite and environment."],
    DESTINATION_NOT_ACCESSIBLE: ["Выберите доступный тип задачи, список или родительскую страницу.", "Select an accessible issue type, list or parent page."],
    STATUS_NOT_ACCESSIBLE: ["Обновите список статусов и выберите доступные значения.", "Refresh statuses and select accessible values."],
    CREDENTIALS_REQUIRED: ["Заполните обязательные поля доступа.", "Fill in the required credential fields."],
    INVALID_SERVICE_URL: ["Укажите адрес сайта вида https://company.atlassian.net.", "Enter a site URL such as https://company.atlassian.net."],
    REMOTE_SCOPE_MISMATCH: ["Ресурс относится к другому проекту, доске, команде или пространству.", "The resource belongs to another project, board, team or space."],
  };
  if (error instanceof TmsApiError) {
    const guidance = connectorFailureLabel(error.code, russian);
    const message = text[error.code]?.[russian ? 0 : 1] ??
      (guidance !== error.code ? guidance :
        (russian ? "Не удалось выполнить действие. Код: " : "The operation failed. Code: ") + error.code);
    return message + (error.requestId ? ` · ${error.requestId}` : "");
  }
  return russian ? "Не удалось связаться с Falcon. Проверьте соединение и повторите." : "Unable to reach Falcon. Check your connection and retry.";
};
