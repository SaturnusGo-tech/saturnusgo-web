import { TmsApiError } from "../../../../../core/tms/transport/http";
export class ImpactReviewConflict extends TmsApiError {
  constructor(cause: TmsApiError, readonly refreshed: boolean) {
    super(cause.message, cause.status, cause.requestId, cause.code, cause.validationField, cause.details);
  }
}
export function impactError(error: unknown, ru: boolean): string {
  if (error instanceof TmsApiError) {
    const message = error instanceof ImpactReviewConflict && error.refreshed
      ? (ru ? "Загружена актуальная версия анализа. Проверьте состав перед повторным действием." : "The latest analysis was loaded. Review the scope before trying again.")
      : error.status === 412 ? (ru ? "Анализ изменился. Обновите данные и проверьте состав ещё раз." : "The analysis changed. Reload and review the scope again.")
      : error.status === 403 ? (ru ? "Недостаточно прав для этого действия." : "You do not have permission for this action.")
      : error.status === 409 ? (ru ? "Действие сейчас недоступно. Обновите анализ и проверьте его состояние." : "This action is unavailable in the current state. Reload the analysis.")
      : (ru ? "Не удалось выполнить запрос. Повторите попытку." : "The request could not be completed. Try again.");
    return `${message} ${error.code}${error.requestId ? ` · ${error.requestId}` : ""}`;
  }
  return ru ? "Ответ сервера не получен. Повторите незавершённый запрос с тем же ключом." : "No server response was received. Retry the unfinished request with its original key.";
}
