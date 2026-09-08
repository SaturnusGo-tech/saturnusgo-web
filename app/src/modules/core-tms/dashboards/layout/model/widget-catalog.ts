import type { BoardWidget, WidgetType } from "./layout";

export type WidgetGroup = "live" | "history" | "library";
export type WidgetDefinition = {
  key: string; type: WidgetType; group: WidgetGroup; width: 3 | 6 | 12;
  ru: string; en: string; hintRu: string; hintEn: string;
};
const metricHints = {
  activeRuns: ["Прогоны, в которых ещё идёт тестирование", "Runs where testing is still ongoing"],
  readyForRetest: ["Исправленные дефекты, ожидающие повторной проверки QA", "Fixed defects waiting for QA verification"],
  blockedItems: ["Проверки активных ранов, которые сейчас нельзя продолжить", "Checks in active runs that cannot proceed"],
  openDefects: ["Незакрытые дефекты в текущей рабочей выборке", "Unresolved defects in the current work scope"],
  notRunItems: ["Кейсы активных ранов, к которым ещё не приступили", "Checks in active runs that have not started"],
  inProgressItems: ["Проверки активных ранов, которые выполняются сейчас", "Checks currently being executed in active runs"],
  outdatedItems: ["Проверки, для которых уже есть новая редакция тест-кейса", "Checks with a newer test case revision available"],
  runsWithoutBuild: ["Активные прогоны без указанной версии сборки", "Active runs without a specified build version"],
  currentCases: ["Размер текущей базы тест-кейсов проекта", "The current size of the project’s test library"],
  casesCreated: ["Тест-кейсы, добавленные за выбранный период", "Test cases added during the selected period"],
  runsLaunched: ["Количество запусков тестирования за выбранный период", "Testing runs launched during the selected period"],
  completedRuns: ["Завершённые прогоны за период, независимо от результата", "Runs completed during the period, regardless of outcome"],
  passedRuns: ["Прогоны, завершённые успешно за выбранный период", "Runs completed successfully during the selected period"],
  passRate: ["Доля успешных среди завершённых прогонов за период", "Successful runs as a share of completed runs in the period"],
  currentDefects: ["Общее число дефектов проекта во всех статусах", "All project defects across every status"],
  reportedDefects: ["Дефекты, зарегистрированные за выбранный период", "Defects reported during the selected period"],
  linkedDefects: ["Дефекты со ссылкой на задачу во внешнем трекере", "Defects linked to an issue in an external tracker"],
  "defect:open": ["Новые дефекты, ожидающие разбора", "New defects waiting for triage"],
  "defect:triaged": ["Разобранные дефекты, ожидающие дальнейшей работы", "Triaged defects waiting for further work"],
  "defect:in_progress": ["Дефекты, над исправлением которых идёт работа", "Defects currently being worked on"],
  "defect:ready_for_retest": ["Все дефекты проекта в статусе «На проверке»", "All project defects in the Ready for QA status"],
  "defect:verified": ["Дефекты, исправление которых проверено", "Defects whose fixes have been verified"],
  "defect:closed": ["Количество закрытых дефектов проекта", "The number of closed project defects"],
  "defect:reopened": ["Дефекты, возвращённые в работу после проверки", "Defects reopened after verification"],
  "type:manual": ["Сценарии в базе, предназначенные для ручной проверки", "Test library scenarios intended for manual execution"],
  "type:automated": ["Кейсы проекта с типом «Автоматизированный»", "Project test cases with the Automated type"],
  "type:checklist": ["Сценарии проекта, оформленные как чек-листы", "Project scenarios organized as checklists"],
} as const;
const metric = (key: keyof typeof metricHints, ru: string, en: string, group: WidgetGroup = "live"): WidgetDefinition => ({
  key, ru, en, type: "summary", group, width: 3,
  hintRu: metricHints[key][0], hintEn: metricHints[key][1],
});
const visual = (key: string, ru: string, en: string, hintRu: string, hintEn: string,
  type: WidgetType, group: WidgetGroup, width: 6 | 12 = 6): WidgetDefinition => ({key, ru, en, hintRu, hintEn, type, group, width});
export const widgetCatalog: readonly WidgetDefinition[] = [
  metric("activeRuns", "Активные раны", "Active runs"),
  metric("readyForRetest", "На проверке", "Ready for QA"),
  metric("blockedItems", "Заблокированные проверки", "Blocked checks"),
  metric("openDefects", "Открытые дефекты", "Open defects"),
  visual("trend", "Динамика прогонов", "Run activity", "Запуски и результаты за 7, 30 или 90 дней", "Launches and outcomes over 7, 30 or 90 days", "run_progress", "history"),
  visual("queue", "Рабочая очередь", "Work queue", "Активные раны и исправления, ожидающие QA", "Active runs and fixes waiting for QA", "assigned_to_me", "live"),
  visual("portfolio", "Компоненты и риски", "Components and risks", "Покрытие, результаты и дефекты по компонентам проекта", "Coverage, outcomes and defects by project component", "summary", "library", 12),
  visual("freshness", "Актуальность проверок", "Check freshness", "Незапущенные, выполняемые и устаревшие проверки", "Unstarted, ongoing and outdated checks", "recent_activity", "live"),
  visual("types", "Состав базы", "Case types", "Ручные, автоматизированные тесты и чек-листы", "Manual cases, automated cases and checklists", "summary", "library"),
  visual("tags", "Теги тест-кейсов", "Case tags", "Распределение тест-кейсов по тегам", "How test cases are distributed by tag", "summary", "library"),
  visual("coverage", "Покрытие", "Coverage", "Проверенные и непроверенные кейсы по компонентам", "Covered and uncovered cases by component", "summary", "library"),
  visual("defects", "Статусы дефектов", "Defect statuses", "Распределение дефектов и связи с трекерами", "Defect lifecycle and tracker links", "defects", "library", 12),
  visual("outcomes", "Результаты прогонов", "Run outcomes", "Распределение результатов за выбранный период", "Outcome distribution for the selected period", "run_progress", "history"),
  metric("notRunItems", "Не запускались", "Not started"),
  metric("inProgressItems", "Выполняются", "In progress"),
  metric("outdatedItems", "Устаревшие ревизии", "Outdated revisions"),
  metric("runsWithoutBuild", "Раны без сборки", "Runs without a build"),
  metric("currentCases", "Всего тест-кейсов", "Total test cases", "library"),
  metric("casesCreated", "Новые тест-кейсы", "New test cases", "history"),
  metric("runsLaunched", "Запущенные раны", "Runs launched", "history"),
  metric("completedRuns", "Завершённые раны", "Completed runs", "history"),
  metric("passedRuns", "Успешные раны", "Passed runs", "history"),
  metric("passRate", "Доля успешных прогонов", "Run pass rate", "history"),
  metric("currentDefects", "Всего дефектов", "Total defects", "library"),
  metric("reportedDefects", "Новые дефекты", "New defects", "history"),
  metric("linkedDefects", "Связаны с трекерами", "Linked defects", "library"),
  metric("defect:open", "Дефекты: открыты", "Defects: open", "library"),
  metric("defect:triaged", "Дефекты: разобраны", "Defects: triaged", "library"),
  metric("defect:in_progress", "Дефекты: в работе", "Defects: in progress", "library"),
  metric("defect:ready_for_retest", "Дефекты: на проверке", "Defects: ready for QA", "library"),
  metric("defect:verified", "Дефекты: проверены", "Defects: verified", "library"),
  metric("defect:closed", "Дефекты: закрыты", "Defects: closed", "library"),
  metric("defect:reopened", "Дефекты: переоткрыты", "Defects: reopened", "library"),
  metric("type:manual", "Ручные тест-кейсы", "Manual cases", "library"),
  metric("type:automated", "Автоматизированные кейсы", "Automated cases", "library"),
  metric("type:checklist", "Чек-листы", "Checklists", "library"),
];
export const widgetByKey = new Map(widgetCatalog.map((widget) => [widget.key, widget]));
export function widgetKey(widget: BoardWidget): string {
  return typeof widget.settings.presentation === "string" ? widget.settings.presentation :
    ({ summary: "currentCases", run_progress: "trend", recent_activity: "freshness", defects: "defects", assigned_to_me: "queue" })[widget.type];
}
export function createBoardWidget(definition: WidgetDefinition, locale: string, id: string): BoardWidget {
  return { id, type: definition.type, title: locale === "ru" ? definition.ru : definition.en,
    position: { x: 0, y: 0, width: definition.width, height: definition.width === 3 ? 1 : 3 },
    settings: { presentation: definition.key } };
}
