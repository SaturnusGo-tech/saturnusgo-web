import type { Activity } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../localization/model/locale";
import type {
  CaseCollaborationFailure, CaseCollaborationResource, CaseLinkedDefect,
  TestCaseComment,
} from "../../../test-cases/collaboration/model/test-case-collaboration";

export type CaseCollaborationViewModel = {
  commentProjectId?: string;
  comments: CaseCollaborationResource<TestCaseComment>;
  defects: CaseCollaborationResource<CaseLinkedDefect>;
  canComment: boolean;
  canConfirmFix: boolean;
  commentSubmitting: boolean;
  commentFailure: CaseCollaborationFailure | null;
  confirmingOccurrenceId: string | null;
  confirmationFailure: { occurrenceId: string; reason: CaseCollaborationFailure } | null;
  addComment: (body: string, options?: Omit<import("../../../test-cases/collaboration/model/drafts/comment-draft").CommentDraft, "body">) => Promise<boolean>;
  changeComment?: (comment: TestCaseComment, draft: import("../../../test-cases/collaboration/model/drafts/comment-draft").CommentDraft | null) => Promise<boolean>;
  revealComment?: (id: string) => Promise<boolean>;
  changingCommentId?: string | null;
  changeFailure?: CaseCollaborationFailure | null;
  confirmFix: (defect: CaseLinkedDefect) => Promise<boolean>;
  retryComments: () => void;
  retryDefects: () => void;
  loadMoreComments: () => void;
  loadMoreDefects: () => void;
  refreshComments: () => void;
  refreshDefects: () => void;
};

export { commentFailureLabel, collaborationFailureLabel } from "./failures/comment-failure";

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
  return labels[target]?.[locale === "ru" ? 1 : 0]
    ?? (locale === "ru" ? "настроенный статус" : "the configured status");
}

export function youTrackCreationLabel(
  locale: TmsLocale,
  creation: NonNullable<CaseLinkedDefect["youTrackCreation"]>,
) {
  const ru = locale === "ru";
  const code = creation.lastErrorCode
    ? `${ru ? " Код" : " Code"}: ${creation.lastErrorCode}.` : "";
  if (creation.status === "pending") return (ru
    ? "Создание задачи YouTrack поставлено в очередь."
    : "YouTrack issue creation is queued.") + code;
  if (creation.status === "published") return (ru
    ? "Запрос на создание задачи YouTrack отправлен; ссылка ещё не получена."
    : "The YouTrack issue creation request was sent; the link is not available yet.") + code;
  if (creation.status === "failed") return (ru
    ? "Не удалось создать задачу YouTrack. Повторите интеграцию или обратитесь к администратору."
    : "Could not create the YouTrack issue. Retry the integration or contact an administrator.") + code;
  return (ru
    ? "YouTrack не подтвердил результат создания задачи. Обновите данные или обратитесь к администратору."
    : "YouTrack did not confirm the issue creation result. Refresh the data or contact an administrator.") + code;
}

export function supersededTransitionLabel(locale: TmsLocale, terminal: boolean) {
  if (!terminal) return locale === "ru"
    ? "Переход YouTrack отменён: баг возвращён в работу."
    : "The YouTrack transition was cancelled: the bug returned to work.";
  return locale === "ru"
    ? "Этот переход YouTrack заменён более новым обновлением статуса."
    : "This YouTrack transition was superseded by a newer status update.";
}
