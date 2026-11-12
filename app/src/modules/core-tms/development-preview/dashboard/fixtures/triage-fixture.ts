import type { DefectTriageRow } from "../../../defects/triage/defect-triage-source";
import type { TmsLocale } from "../../../localization/model/locale";

export function createTriageRows(locale: TmsLocale, projectId: string): DefectTriageRow[] {
  const ru = locale === "ru", now = Date.now();
  const entries = ru ? [
    ["Повтор платежа после таймаута создаёт второе списание", "Платежи", "Запрос с тем же ключом идемпотентности повторяется после сетевого таймаута.", "API возвращает 201 и создаёт второй платёж.", "Вернуть исходный платёж без повторного списания."],
    ["После переноса брони календарь хоста показывает прежние даты", "Календарь", "Подтверждённая бронь переносится на другие свободные даты.", "В карточке даты обновились, но календарь продолжает показывать прежний интервал.", "Карточка, календарь и задачи подготовки используют новые даты."],
    ["Экспорт отчёта не учитывает фильтр по окружению", "Отчёты", "В отчёте выбрано только окружение Staging.", "CSV также содержит результаты из Production.", "Экспорт содержит только результаты выбранного окружения."],
    ["Уведомление о подтверждении брони приходит дважды", "Уведомления", "После восстановления соединения клиент повторно получает событие подтверждения.", "Гостю отправлены два одинаковых push-уведомления.", "Повторное событие обрабатывается без дублирования уведомления."],
    ["Таблица результатов теряет выбранную сортировку", "Результаты", "Пользователь сортирует результаты по приоритету и открывает детальную карточку.", "После закрытия карточки сортировка сбрасывается на дату обновления.", "Сохраняется выбранная сортировка и позиция списка."],
    ["Подсказка суммы перекрывает кнопку оплаты на узком экране", "Оформление брони", "Сумма включает проживание, уборку и дополнительную услугу.", "Подсказка перекрывает основное действие при ширине 375 px.", "Сумма читается полностью, кнопка оплаты доступна без перекрытия."],
    ["Отмена брони не освобождает даты до обновления страницы", "Бронирования", "Гость отменяет подтверждённую бронь в разрешённый период.", "В календаре даты остаются занятыми до перезагрузки.", "Даты освобождаются сразу после подтверждения отмены."],
    ["Пустой отчёт отображает неверный текст", "Отчёты", "За выбранный период нет завершённых прогонов.", "Экран предлагает создать тест-кейс вместо изменения периода.", "Показать понятное состояние без результатов и выбранный период."],
  ] : [
    ["Retrying a payment after a timeout creates a second charge", "Payments", "The same idempotency key is reused after a network timeout.", "The API returns 201 and creates a second payment.", "Return the original payment without charging the customer again."],
    ["Rescheduled booking keeps the previous dates in the host calendar", "Calendar", "A confirmed booking is moved to another available date range.", "The booking card updates, but the calendar keeps the previous dates.", "The booking, calendar and preparation tasks use the new dates."],
    ["Report export ignores the selected environment", "Reports", "The report is filtered to the Staging environment.", "The CSV also contains results from Production.", "Export only results from the selected environment."],
    ["Booking confirmation notification is delivered twice", "Notifications", "The client receives the confirmation event again after reconnecting.", "The guest receives two identical push notifications.", "Handle the repeated event without sending a duplicate notification."],
    ["Results table loses its selected sort order", "Results", "A QA sorts results by priority and opens a result detail.", "Closing the detail resets sorting to the update date.", "Preserve the selected order and the list scroll position."],
    ["Price breakdown covers the payment action on narrow screens", "Checkout", "The total includes accommodation, cleaning and an extra service.", "The price tooltip covers the primary action at a 375 px viewport.", "Keep the total readable and the payment action unobstructed."],
    ["Cancelling a booking does not release its dates until refresh", "Bookings", "A guest cancels a confirmed booking within the allowed period.", "The calendar keeps the dates occupied until the page reloads.", "Release the dates immediately after cancellation is confirmed."],
    ["Empty report uses the wrong guidance", "Reports", "No completed runs exist for the selected period.", "The empty state suggests creating a test case instead of changing the period.", "Show an understandable empty state and the selected reporting period."],
  ];
  const priorities = ["critical", "high", "medium", "medium", "low", "high", "high", "low"] as const;
  const authors = ["preview_codex", "preview_maya", "preview_alex", "preview_priya"];
  return entries.map(([title, component, description, actualResult, expectedResult], index) => ({
    id: `preview_defect_${index + 1}`, projectId, key: `QA-BUG-${184 - index}`, title,
    description, actualResult, expectedResult, component, priority: priorities[index],
    severity: index === 2 ? "low" : priorities[index], status: index === 1 ? "reopened" : "open",
    reproducibility: ru ? "Всегда" : "Always", assigneeIdentityId: authors[(index + 1) % 3],
    labels: index === 0 ? ["api", "payments", "regression"] : index === 5 ? ["web", "responsive"] : ["regression"],
    integrationTarget: null, externalIssue: index === 3 ? { provider: "youtrack", id: "preview_remote_1", key: "UMBR-92",
      url: "https://preview.invalid/issue/UMBR-92", syncStatus: "linked", status: "Open", workflowState: "backlog",
      readyForTest: false, lastSyncedAt: new Date(now - 15 * 60_000).toISOString() } : null,
    occurrence: index === 0 || index === 2 ? { id: `preview_occurrence_${index}`, runId: "preview_run_regression",
      runItemId: `preview_item_${index}`, attemptNo: 1, stepId: null, createdAt: new Date(now - (index + 1) * 3_600_000).toISOString() } : null,
    sourceCaseId: index === 4 ? "preview_case_results" : null, attachmentIds: [], linkIds: [],
    createdByIdentityId: authors[index % authors.length], createdAt: new Date(now - (index + 1) * 86_400_000).toISOString(),
    updatedAt: new Date(now - [4, 18, 47, 95, 180, 370, 540, 1000][index] * 60_000).toISOString(),
    triageDuplicateOfDefectId: null, rowVersion: 1,
    triageSnoozedUntil: index > 5 ? new Date(now + (index - 5) * 86_400_000).toISOString() : null,
  }));
}

