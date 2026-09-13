import { TmsApiError } from "../../../../core/tms/transport/http";
export function apiSourceError(error: unknown, ru: boolean) {
  const code = error instanceof TmsApiError ? error.code : "";
  if (error instanceof TmsApiError && error.status === 403) return ru ? "Нет доступа к этому API." : "You do not have access to this API.";
  if (code === "PRECONDITION_FAILED") return ru ? "Подключение изменилось. Обновите данные перед сохранением." : "The connection changed. Reload before saving.";
  if (code === "CREDENTIALS_REQUIRED") return ru ? "Укажите данные доступа к документации." : "Enter the documentation credentials.";
  if (code === "PROJECT_NOT_FOUND") return ru ? "Один из проектов больше недоступен. Обновите список." : "A project is no longer available. Reload the list.";
  if (code === "CONNECTION_DISABLED") return ru ? "API отключён. Его можно включить в настройках подключения." : "This API is disabled. Enable it in connection settings.";
  if (code === "API_SOURCE_NOT_FOUND") return ru ? "API больше не подключён к выбранным проектам." : "This API is no longer linked to the selected projects.";
  if (code.startsWith("SPECIFICATION_") || code.startsWith("UPSTREAM_")) return ru ? "Не удалось прочитать документацию. Проверьте прямую ссылку на JSON или YAML и данные доступа." : "Could not read the documentation. Check the direct JSON or YAML URL and credentials.";
  return ru ? "Не удалось загрузить или сохранить API. Повторите попытку." : "Could not load or save the API. Try again.";
}
