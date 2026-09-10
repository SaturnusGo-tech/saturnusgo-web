import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseCollaborationFailure } from "../../../../test-cases/collaboration/model/test-case-collaboration";
export function collaborationFailureLabel(
  locale: TmsLocale,
  failure: CaseCollaborationFailure | null,
) {
  const ru = locale === "ru";
  if (failure === "forbidden") return ru
    ? "Недостаточно прав для этого действия."
    : "You do not have permission for this action.";
  if (failure === "stale") return ru
    ? "Статус бага изменился. Данные обновлены. Проверьте их и повторите."
    : "The bug status changed. Review the refreshed data and try again.";
  if (failure === "retest_required") return ru
    ? "Нужен новый успешный повторный прогон этого кейса и шага."
    : "A new successful retest of this case and step is required.";
  if (failure === "youtrack_required") return ru
    ? "Связь с задачей YouTrack больше недоступна. Обновите историю и повторите."
    : "The YouTrack issue link is no longer available. Refresh the history and try again.";
  if (failure === "youtrack_workflow_guard") return ru
    ? "Защита workflow YouTrack ещё не настроена или не проверена администратором."
    : "The YouTrack workflow guard has not been configured or verified by an administrator.";
  if (failure === "youtrack_not_ready") return ru
    ? "Задача YouTrack ещё не готова к тестированию. Дождитесь нужного статуса и обновите историю."
    : "The YouTrack issue is not ready for testing yet. Wait for the required status and refresh.";
  if (failure === "invalid_transition") return ru
    ? "Этот переход статуса больше недоступен."
    : "This status transition is no longer available.";
  return ru
    ? "Не удалось выполнить действие. Проверьте подключение и повторите."
    : "The action failed. Check your connection and try again.";
}

export function commentFailureLabel(
  locale: TmsLocale,
  failure: CaseCollaborationFailure | null,
) {
  if (failure === "invalid_mentions") return locale === "ru"
    ? "Один из выбранных сотрудников больше недоступен. Обновите список упоминаний."
    : "A selected teammate is no longer available. Update your mentions.";
  if (failure === "missing_parent") return locale === "ru"
    ? "Исходный комментарий удалён или недоступен. Сохраните текст и отправьте отдельный комментарий."
    : "The original comment is no longer available. Keep your draft and post a separate comment.";
  if (failure === "channel_unavailable") return locale === "ru"
    ? "Slack отключён у проекта. Снимите выбор Slack или подключите интеграцию."
    : "Project Slack is disconnected. Deselect Slack or reconnect the integration.";
  if (failure === "invalid_transition") return locale === "ru"
    ? "Этот тест-кейс больше не принимает новые комментарии."
    : "This test case no longer accepts new comments.";
  if (failure === "stale") return locale === "ru" ? "Комментарий изменён. Скопируйте свой текст, отмените редактирование и откройте его заново."
    : "The comment changed. Copy your draft, cancel editing, and reopen it.";
  return collaborationFailureLabel(locale, failure);
}

