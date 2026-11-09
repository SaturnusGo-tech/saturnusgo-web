import { widgetByKey, type WidgetDefinition } from "../../../../../dashboards/layout/model/widget-catalog";
import { widgetSection } from "../../../../../dashboards/layout/sections/widget-sections";

type Localized = [string, string];
type Detail = { purpose: Localized; overlap: Localized; included?: Localized[]; related: string[] };
const details: Record<string, Detail> = {
  queue: {
    purpose: ["Помогает выбрать следующую задачу: продолжить прогон или проверить исправление.", "Choose the next task: continue a run or verify a fix."],
    overlap: ["Показывает конкретные задачи. «Актуальность проверок» даёт сводку той же рабочей выборки, а «На проверке» — число исправлений.", "Shows individual tasks. Check freshness summarizes the same work scope; Ready for QA counts fixes awaiting verification."],
    included: [["Активные прогоны", "Active runs"], ["Исправления, ожидающие QA", "Fixes awaiting QA"]],
    related: ["freshness", "readyForRetest"],
  },
  freshness: {
    purpose: ["Объединяет сигналы текущей работы, чтобы вовремя заметить блокировки и устаревшие проверки.", "Brings current work signals together so blocked and outdated checks are easy to spot."],
    overlap: ["Эти сигналы уже собраны здесь. Отдельные карточки для них не нужны; к задачам можно перейти через рабочую очередь.", "These signals are already included here. Use the work queue to reach the underlying tasks."],
    included: [["Активные раны", "Active runs"], ["Заблокированные проверки", "Blocked checks"], ["Открытые дефекты", "Open defects"],
      ["Не запускались", "Not started"], ["Выполняются", "In progress"], ["Устаревшие ревизии", "Outdated revisions"], ["Раны без сборки", "Runs without a build"]],
    related: ["queue", "readyForRetest"],
  },
  readyForRetest: {
    purpose: ["Показывает исправления из текущей рабочей выборки, которые QA может проверить сейчас.", "Shows fixes in the current work scope that QA can verify now."],
    overlap: ["Рабочая очередь содержит эти исправления списком. «Дефекты: на проверке» считает все дефекты проекта в этом статусе, поэтому значения могут различаться.", "The work queue lists these fixes. Defects: ready for QA counts all project defects in that status, so its total may differ."],
    related: ["queue", "defect:ready_for_retest"],
  },
  defects: {
    purpose: ["Помогает увидеть, на каком этапе находятся исправления и сколько дефектов связано с трекерами.", "See which stage fixes have reached and how many defects are linked to trackers."],
    overlap: ["Карточки отдельных статусов, общего числа дефектов и связей с трекерами повторяют показатели этой сводки. Добавляйте их, если нужен отдельный акцент.", "Individual status, total-defect and tracker-link cards repeat figures in this summary. Add them when a particular metric needs emphasis."],
    included: [["Открыты", "Open"], ["Разобраны", "Triaged"], ["В работе", "In progress"], ["На проверке", "Ready for QA"],
      ["Проверены", "Verified"], ["Закрыты", "Closed"], ["Переоткрыты", "Reopened"]],
    related: ["currentDefects", "readyForRetest", "linkedDefects"],
  },
  types: {
    purpose: ["Показывает состав базы тестов и соотношение ручных, автоматизированных кейсов и чек-листов.", "See the test library composition across manual cases, automated cases and checklists."],
    overlap: ["Карточки отдельных типов и общего числа тест-кейсов используют ту же базу. Добавляйте их для быстрого доступа к одному показателю.", "Individual case-type and total-case cards use the same library. Add them for direct access to a single metric."],
    included: [["Ручные тест-кейсы", "Manual cases"], ["Автоматизированные кейсы", "Automated cases"], ["Чек-листы", "Checklists"]],
    related: ["currentCases", "type:manual", "type:automated"],
  },
  trend: {
    purpose: ["Показывает, как меняются запуски и результаты прогонов за выбранный период.", "See how run launches and outcomes change over the selected period."],
    overlap: ["«Результаты прогонов» показывает итоговое распределение за тот же период; числовые карточки выделяют отдельные итоги.", "Run outcomes shows the distribution for the same period; metric cards highlight individual totals."],
    related: ["outcomes", "runsLaunched", "passRate"],
  },
  outcomes: {
    purpose: ["Помогает сравнить результаты прогонов за выбранный период.", "Compare run outcomes over the selected period."],
    overlap: ["Использует те же прогоны, что и «Динамика прогонов». «Успешные раны» и «Доля успешных прогонов» выделяют часть этих данных.", "Uses the same runs as Run activity. Passed runs and Run pass rate highlight a portion of these results."],
    related: ["trend", "passedRuns", "passRate"],
  },
  portfolio: {
    purpose: ["Помогает сравнить покрытие, результаты и дефекты по компонентам проекта.", "Compare coverage, outcomes and defects across project components."],
    overlap: ["«Покрытие» рассматривает тест-кейсы подробнее. Эта сводка добавляет результаты прогонов и риски компонентов.", "Coverage provides a closer view of test cases. This summary adds run outcomes and component risks."],
    related: ["coverage", "defects"],
  },
  coverage: {
    purpose: ["Помогает найти тест-кейсы, ещё не включённые в прогоны, и пробелы по компонентам.", "Find cases not yet included in runs and coverage gaps by component."],
    overlap: ["«Компоненты и риски» использует связанные данные покрытия вместе с результатами и дефектами.", "Components and risks combines related coverage data with outcomes and defects."],
    related: ["portfolio", "currentCases"],
  },
  tags: {
    purpose: ["Показывает, как тест-кейсы распределены по тегам, и помогает найти нужную группу.", "See how cases are distributed by tag and find a specific group."],
    overlap: ["У кейса может быть несколько тегов. Сумма значений по тегам может превышать общее число тест-кейсов.", "A case may have multiple tags. Tag totals can therefore exceed the total number of cases."],
    related: ["types", "currentCases"],
  },
};

const workflowDetails: Record<string, Detail & { context: Localized }> = {
  queue: {
    purpose: ["Выберите проверку, требующую внимания, или разберите входящие дефекты.", "Find a check that needs attention or triage incoming defects."],
    context: ["Проверки учитывают окружение и сборку. Триаж показывает очередь выбранного проекта.", "Check signals follow environment and build filters. Triage shows the selected project's inbox."],
    overlap: ["Карта дефектов даёт обзор статусов, здесь можно принять решение по отдельной записи.", "Defect map summarizes statuses. Use this queue to make decisions on individual defects."],
    included: [["Сигналы QA", "QA signals"], ["Входящие и отложенные дефекты", "Inbox and snoozed defects"]],
    related: ["defects"],
  },
  defects: {
    purpose: ["Откройте список дефектов по статусу, дате создания или наличию ссылки.", "Open the underlying defects by status, report date or linked issue."],
    context: ["Статусы и ссылки отражают текущее состояние. Новые дефекты считаются за выбранный период.", "Statuses and links reflect the current state. New defects use the selected period."],
    overlap: ["Входящие дефекты можно разобрать в очереди QA.", "Use the QA queue to triage incoming defects."],
    related: ["queue"],
  },
  types: {
    purpose: ["Сравните типы кейсов и откройте записи выбранного типа прямо в виджете.", "Compare case types and open the records for a selected type from the widget."],
    context: ["Переключайтесь между текущей базой и кейсами, созданными за выбранный период.", "Switch between the current library and cases created during the selected period."],
    overlap: ["Покрытие показывает, какие кейсы попали в прогоны.", "Coverage shows which cases were included in runs."],
    related: ["coverage", "tags"],
  },
  defectPerformance: {
    purpose: ["Посмотрите открытые дефекты, срок до первого решения и статусы новых записей.", "Inspect open bugs, time to first resolution, and current statuses of reported defects."],
    context: ["Открытые дефекты отражают текущее состояние. Для новых и решённых дефектов используется выбранный период.", "Open bugs use current inventory. Reports and resolutions use the selected period."],
    overlap: ["В Insights можно разбить дефекты по ответственным, продуктам и другим полям.", "Use Defect map to break defects down by assignee, product and other properties."],
    related: ["defects", "queue"],
  },
  completedRuns: {
    purpose: ["Выберите дату и результат, чтобы увидеть завершённые прогоны и открыть нужный.", "Choose a date and outcome to inspect the completed runs and open a record."],
    context: ["Учитывается дата завершения в пределах выбранного периода.", "Uses completion dates within the selected period."],
    overlap: ["Динамика прогонов показывает запуски и результаты по времени.", "Run activity charts launches and outcomes over time."],
    related: ["trend", "outcomes"],
  },
};

export function widgetDetails(widget: WidgetDefinition, locale: string, workflowPreview = false) {
  const index = locale === "ru" ? 0 : 1;
  const section = widgetSection(widget.key);
  const parent = widget.key.startsWith("defect:") || ["currentDefects", "linkedDefects"].includes(widget.key) ? "defects"
    : widget.key.startsWith("type:") || widget.key === "currentCases" ? "types"
    : section === "runs" ? "outcomes" : undefined;
  const workflow = workflowPreview ? workflowDetails[widget.key] : undefined;
  const detail = workflow ?? details[widget.key];
  const context: Localized = section === "overview"
    ? ["Текущая рабочая выборка с выбранными фильтрами окружения и сборки.", "Current work scope with the selected environment and build filters."]
    : widget.group === "history"
      ? ["Выбранный проект и период дашборда: 7, 30 или 90 дней.", "Selected project and dashboard period: 7, 30 or 90 days."]
      : ["Текущее состояние выбранного проекта. Не ограничено периодом прогонов.", "Current state of the selected project, independent of the run period."];
  const parentWidget = parent ? widgetByKey.get(parent) : undefined;
  return {
    purpose: detail?.purpose[index] ?? (index === 0 ? widget.hintRu : widget.hintEn),
    overlap: detail?.overlap[index] ?? (parentWidget
      ? index === 0 ? `Этот показатель также есть в виджете «${parentWidget.ru}». Отдельная карточка помогает держать его в фокусе.`
        : `This metric also appears in ${parentWidget.en}. A separate card keeps it in focus.`
      : index === 0 ? "Показывает изменения за период. Не заменяет общее число объектов проекта."
        : "Shows changes within the period. It does not replace the current project total."),
    context: workflow?.context[index] ?? (widget.key === "portfolio" ? (index === 0
      ? "Текущая база и дефекты проекта; результаты прогонов за выбранный период."
      : "Current project library and defects; run outcomes for the selected period.") : context[index]), included: detail?.included?.map((item) => item[index]) ?? [],
    related: (detail?.related ?? (parent ? [parent] : [section === "library" ? "currentCases" : "currentDefects"]))
      .map((key) => widgetByKey.get(key)).filter((item): item is WidgetDefinition => Boolean(item) && item?.key !== widget.key),
  };
}
