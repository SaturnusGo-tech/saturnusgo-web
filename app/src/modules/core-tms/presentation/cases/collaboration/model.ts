import type { Activity } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../localization/model/locale";
import type {
  CaseCollaborationFailure, CaseCollaborationResource, CaseLinkedDefect,
  TestCaseComment,
} from "../../../test-cases/collaboration/model/test-case-collaboration";

export type CaseCollaborationViewModel = {
  comments: CaseCollaborationResource<TestCaseComment>;
  defects: CaseCollaborationResource<CaseLinkedDefect>;
  canComment: boolean;
  canConfirmFix: boolean;
  commentSubmitting: boolean;
  commentFailure: CaseCollaborationFailure | null;
  confirmingOccurrenceId: string | null;
  confirmationFailure: { occurrenceId: string; reason: CaseCollaborationFailure } | null;
  addComment: (body: string) => Promise<boolean>;
  confirmFix: (defect: CaseLinkedDefect) => Promise<boolean>;
  retryComments: () => void;
  retryDefects: () => void;
  loadMoreComments: () => void;
  loadMoreDefects: () => void;
  refreshComments: () => void;
  refreshDefects: () => void;
};

export function collaborationFailureLabel(
  locale: TmsLocale,
  failure: CaseCollaborationFailure | null,
) {
  const ru = locale === "ru";
  if (failure === "forbidden") return ru
    ? "Недостаточно прав для этого действия."
    : "You do not have permission for this action.";
  if (failure === "stale") return ru
    ? "Статус бага изменился. Данные обновлены — проверьте их и повторите."
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
  if (failure === "invalid_transition") return locale === "ru"
    ? "Этот тест-кейс больше не принимает новые комментарии."
    : "This test case no longer accepts new comments.";
  return collaborationFailureLabel(locale, failure);
}

export function fixBlockedLabel(locale: TmsLocale, defect: CaseLinkedDefect) {
  const ru = locale === "ru";
  if (defect.fixConfirmationBlockedReason === "not_ready_for_test") return ru
    ? "Подтверждение станет доступно, когда баг будет готов к тестированию."
    : "Confirmation becomes available when the bug is ready for testing.";
  if (defect.fixConfirmationBlockedReason === "youtrack_link_required") return ru
    ? "Для подтверждения нужна активная задача YouTrack."
    : "An active YouTrack issue is required for confirmation.";
  if (defect.fixConfirmationBlockedReason === "youtrack_workflow_guard_required") return ru
    ? "Подтверждение недоступно, пока администратор не настроит и не проверит защиту workflow YouTrack."
    : "Confirmation is unavailable until an administrator configures and verifies the YouTrack workflow guard.";
  if (defect.fixConfirmationBlockedReason === "youtrack_not_ready_for_test") return ru
    ? "Сначала переведите задачу YouTrack в готовый к тестированию или приёмке статус."
    : "Move the YouTrack issue to a ready-for-test or acceptance state first.";
  if (defect.fixConfirmationBlockedReason === "retest_required") return ru
    ? "Сначала запустите этот кейс повторно и успешно пройдите нужный шаг."
    : "Run this case again and pass the required step first.";
  return "";
}

export function defectStepLabel(
  locale: TmsLocale,
  occurrence: CaseLinkedDefect["occurrence"],
) {
  if (!occurrence.stepId) return locale === "ru" ? "Весь тест-кейс" : "Entire test case";
  return occurrence.stepOrder === null
    ? (locale === "ru" ? "Шаг теста" : "Test step")
    : `${locale === "ru" ? "Шаг" : "Step"} ${occurrence.stepOrder}`;
}

export function caseActivityForKey(activity: Activity[], key?: string) {
  return activity.filter((entry) => entry.entityKey === key).sort((left, right) => (
    Date.parse(right.createdAt) - Date.parse(left.createdAt)
  ));
}

export function activityActorLabel(actor: string) {
  return /^(?:identity|user|auth0)[_:\-|]/i.test(actor)
    || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(actor) ? "Falcon" : actor;
}

export function hasExactFixVerification(defect: CaseLinkedDefect) {
  return defect.fixVerification?.occurrenceId === defect.occurrence.id;
}

export function fixVerificationSourceLabel(
  locale: TmsLocale,
  defect: CaseLinkedDefect,
  currentCaseId: string,
) {
  const verification = defect.fixVerification;
  if (!verification) return "";
  const ru = locale === "ru";
  if (verification.occurrenceId === defect.occurrence.id) {
    return ru ? "этого баг-репорта" : "this bug report";
  }
  if (verification.testCaseId !== currentCaseId) {
    return ru ? "другого тест-кейса" : "another test case";
  }
  if (verification.stepId !== null && verification.stepId === defect.occurrence.stepId) {
    return ru ? "другого прогона этого шага" : "another run of this step";
  }
  return ru ? "другого баг-репорта этого тест-кейса" : "another report in this test case";
}

export function hasYouTrackSyncWarning(defect: CaseLinkedDefect) {
  const terminal = defect.status === "verified" || defect.status === "closed";
  const creationFailed = !defect.youTrack
    && (defect.youTrackCreation?.status === "failed"
      || defect.youTrackCreation?.status === "uncertain");
  return creationFailed || defect.youTrack?.syncStatus === "error"
    || defect.youTrack?.syncStatus === "deleted"
    || Boolean(terminal && defect.youTrackTransition?.status === "failed")
    || Boolean(terminal && defect.youTrackTransition && !defect.youTrack);
}

export function hasObservedYouTrackAcceptance(defect: CaseLinkedDefect) {
  return (defect.status === "verified" || defect.status === "closed")
    && Boolean(defect.youTrackTransition?.observedAccepted)
    && defect.youTrackTransition?.status !== "superseded"
    && !hasYouTrackSyncWarning(defect);
}

export function youTrackTargetLabel(locale: TmsLocale, target: string) {
  const labels: Record<string, readonly [string, string]> = {
    Acceptance: ["Acceptance", "Приёмка"],
    Staging: ["Staging", "Тестовое окружение"],
    Done: ["Done", "Готово"],
  };
  return labels[target]?.[locale === "ru" ? 1 : 0] ?? target;
}

export function youTrackCreationLabel(
  locale: TmsLocale,
  creation: NonNullable<CaseLinkedDefect["youTrackCreation"]>,
) {
  const ru = locale === "ru";
  const target = creation.target === "backend" ? (ru ? "бэкенд" : "backend")
    : creation.target === "android" ? "Android" : "iOS";
  const code = creation.lastErrorCode
    ? `${ru ? " Код" : " Code"}: ${creation.lastErrorCode}.` : "";
  if (creation.status === "pending") return (ru
    ? `Создание задачи YouTrack (${target}) поставлено в очередь.`
    : `YouTrack issue creation (${target}) is queued.`) + code;
  if (creation.status === "published") return (ru
    ? `Запрос на создание задачи YouTrack (${target}) отправлен; ссылка ещё не получена.`
    : `The YouTrack issue creation request (${target}) was sent; the link is not available yet.`) + code;
  if (creation.status === "failed") return (ru
    ? `Не удалось создать задачу YouTrack (${target}). Повторите интеграцию или обратитесь к администратору.`
    : `Could not create the YouTrack issue (${target}). Retry the integration or contact an administrator.`) + code;
  return (ru
    ? `YouTrack не подтвердил результат создания задачи (${target}). Обновите данные или обратитесь к администратору.`
    : `YouTrack did not confirm the issue creation result (${target}). Refresh the data or contact an administrator.`) + code;
}

export function supersededTransitionLabel(locale: TmsLocale, terminal: boolean) {
  if (!terminal) return locale === "ru"
    ? "Переход YouTrack отменён: баг возвращён в работу."
    : "The YouTrack transition was cancelled: the bug returned to work.";
  return locale === "ru"
    ? "Этот переход YouTrack заменён более новым обновлением статуса."
    : "This YouTrack transition was superseded by a newer status update.";
}
