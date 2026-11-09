import type { DashboardSection } from "../../../../../dashboards/layout/sections/widget-sections";

const labels = {
  ru: { overview: "Текущая работа", runs: "Прогоны", defects: "Дефекты", library: "База тестов" },
  en: { overview: "Current work", runs: "Runs", defects: "Defects", library: "Test library" },
};
export const sectionLabel = (section: DashboardSection, locale: string) => labels[locale === "ru" ? "ru" : "en"][section];
export const catalogCopy = (locale: string) => locale === "ru" ? {
  back: "К дашборду", done: "Готово", added: "Добавлено", all: "Все виджеты", addAll: "Добавить все",
  bulkAdded: "Все виджеты добавлены в дашборд", bulkSaveHint: "Сохраните изменения, чтобы применить раскладку.",
  count: (count: number) => `${count} виджетов для вашего проекта`, found: "Найдено", clear: "Сбросить поиск",
  preview: "Предпросмотр", example: "Пример отображения", section: "Раздел", related: "Связанные виджеты",
  includes: "В составе виджета", overlap: "Пересечения с другими виджетами", context: "Контекст данных",
  add: "Добавить виджет", show: "Показать состав", hide: "Скрыть состав", alreadyAdded: "Виджет добавлен",
} : {
  back: "Back to dashboard", done: "Done", added: "Added", all: "All widgets", addAll: "Add all",
  bulkAdded: "All widgets added to the dashboard", bulkSaveHint: "Save your changes to apply the layout.",
  count: (count: number) => `${count} widgets for your project`, found: "Found", clear: "Clear search",
  preview: "Preview", example: "Example layout", section: "Section", related: "Related widgets",
  includes: "Included in this widget", overlap: "Overlap with other widgets", context: "Data context",
  add: "Add widget", show: "Show contents", hide: "Hide contents", alreadyAdded: "Widget added",
};
