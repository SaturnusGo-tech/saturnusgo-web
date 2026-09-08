import type { BoardWidget, WidgetType } from "./layout";

export type WidgetGroup = "live" | "history" | "library";
export type WidgetDefinition = {
  key: string; type: WidgetType; group: WidgetGroup; width: 3 | 6 | 12;
  ru: string; en: string; hintRu: string; hintEn: string;
};
const metric = (key: string, ru: string, en: string, group: WidgetGroup = "live"): WidgetDefinition => ({
  key, ru, en, type: "summary", group, width: 3,
  hintRu: group === "history" ? "Показатель за выбранный период · откройте исходные записи" : "Текущее значение · откройте исходные записи",
  hintEn: group === "history" ? "Selected period · open the underlying records" : "Current value · open the underlying records",
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
