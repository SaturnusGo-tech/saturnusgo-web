import { TmsApiError } from "../../../../../core/tms/transport/http";
export function impactError(error: unknown, ru: boolean): string {
  if (error instanceof TmsApiError) {
    const message = error.status === 412 ? (ru ? "Анализ изменился. Обновите данные и проверьте состав ещё раз." : "The analysis changed. Reload and review the scope again.")
      : error.status === 403 ? (ru ? "Недостаточно прав для этого действия." : "You do not have permission for this action.")
      : error.status === 409 ? (ru ? "Действие сейчас недоступно. Обновите анализ и проверьте его состояние." : "This action is unavailable in the current state. Reload the analysis.")
      : (ru ? "Не удалось выполнить запрос. Повторите попытку." : "The request could not be completed. Try again.");
    return `${message} ${error.code}${error.requestId ? ` · ${error.requestId}` : ""}`;
  }
  return ru ? "Ответ сервера не получен. Повторите незавершённый запрос с тем же ключом." : "No server response was received. Retry the unfinished request with its original key.";
}
