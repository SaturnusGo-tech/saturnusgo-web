import type { TmsLocale } from "../../../localization/model/locale";

export function productDocReviewCopy(locale: TmsLocale) {
  const ru = locale === "ru";
  return {
    title: ru ? "Ревью" : "Review",
    close: ru ? "Закрыть ревью" : "Close review",
    back: ru ? "Назад к ревью" : "Back to review",
    request: ru ? "Запросить ревью" : "Request review",
    send: ru ? "Отправить запрос" : "Send request",
    sent: ru ? "Запрос на ревью отправлен" : "Review requested",
    cancel: ru ? "Отмена" : "Cancel",
    loading: ru ? "Загрузка ревью…" : "Loading reviews…",
    retry: ru ? "Повторить" : "Retry",
    more: ru ? "Загрузить ещё" : "Load more",
    loadError: ru ? "Не удалось загрузить ревью." : "Could not load reviews.",
    empty: ru ? "По этой статье ещё не запрашивали ревью." : "No reviews requested for this article yet.",
    saveFirst: ru ? "Сохраните черновик, чтобы запросить ревью." : "Save the draft to request a review.",
    decisionDirty: ru ? "Вернитесь к сохранённому черновику, чтобы оставить решение." : "Return to the saved draft to submit a decision.",
    outdated: ru ? "Откройте актуальный черновик, чтобы продолжить." : "Reopen the latest draft to continue.",
    draft: ru ? "Черновик" : "Draft",
    earlier: ru ? "Предыдущий черновик" : "Earlier draft",
    reviewer: ru ? "Ревьюер" : "Reviewer",
    findMember: ru ? "Найти по имени или почте" : "Find by name or email",
    membersEmpty: ru ? "Участники не найдены." : "No members found.",
    membersLoading: ru ? "Загрузка участников…" : "Loading members…",
    membersError: ru ? "Не удалось загрузить участников." : "Could not load members.",
    target: ru ? "Область ревью" : "Review scope",
    article: ru ? "Вся статья" : "Entire article",
    untitled: ru ? "Раздел без названия" : "Untitled section",
    section: ru ? "Раздел статьи" : "Article section",
    pending: ru ? "Ожидает ревью" : "Pending review",
    approved: ru ? "Одобрено" : "Approved",
    approvalSaved: ru ? "Одобрение сохранено. Опубликовать черновик может участник с правом публикации."
      : "Approval saved. A teammate with publishing access can publish this draft.",
    changes_requested: ru ? "Запрошены изменения" : "Changes requested",
    approve: ru ? "Одобрить" : "Approve",
    changes: ru ? "Запросить изменения" : "Request changes",
    addDecision: ru ? "Оставить решение" : "Review this draft",
    openDraft: ru ? "Открыть черновик" : "Open draft",
    note: ru ? "Комментарий (необязательно)" : "Note (optional)",
    busy: ru ? "Сохранение…" : "Saving…",
    stale: ru ? "Черновик изменился. Откройте его актуальную версию." : "The draft changed. Reopen its latest version.",
    conflict: ru ? "Запрос уже существует или решение уже принято." : "A request already exists or a decision has been submitted.",
    unavailable: ru ? "У выбранного участника нет доступа к черновику. Выберите другого ревьюера." : "This member cannot open the draft. Choose another reviewer.",
    forbidden: ru ? "У вас нет доступа к этому действию." : "You don’t have permission for this action.",
    missing: ru ? "Статья, раздел или запрос ревью больше недоступны." : "The article, section, or review request is no longer available.",
    failure: ru ? "Не удалось сохранить ревью. Повторите попытку." : "Could not save the review. Try again.",
  };
}

export type ProductDocReviewCopy = ReturnType<typeof productDocReviewCopy>;

export function productDocReviewError(copy: ProductDocReviewCopy, error: string) {
  switch (error) {
    case "PRODUCT_DOC_STALE_DRAFT": return copy.stale;
    case "PRODUCT_DOC_REVIEW_CONFLICT": return copy.conflict;
    case "PRODUCT_DOC_REVIEWER_UNAVAILABLE": return copy.unavailable;
    case "PRODUCT_DOC_ACCESS_DENIED": return copy.forbidden;
    case "PRODUCT_DOC_NOT_FOUND": return copy.missing;
    default: return copy.failure;
  }
}
