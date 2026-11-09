export const insightCopy = {
  en: {
    scope: "Scope", caseType: "Case type", expand: "Expand insights", collapse: "Exit expanded view",
    metric: "Metric", dimension: "Dimension", segment: "Segment", none: "None", count: "Count", total: "Total",
    defects: "defects", cases: "cases", currentDefects: "Current defects", currentCases: "Current cases",
    new: "New in period", all: "All defects", linked: "Linked only", allTypes: "All types",
    project: "Project", component: "Product", assignee: "Assignee", status: "Status", priority: "Priority",
    severity: "Severity", type: "Type", noRecords: "No matching records", close: "Close records",
    coverage: (shown: string, total: string) => `${shown} of ${total} groups`,
  },
  ru: {
    scope: "Выборка", caseType: "Тип кейса", expand: "Развернуть аналитику", collapse: "Свернуть аналитику",
    metric: "Метрика", dimension: "Группировка", segment: "Сегмент", none: "Нет", count: "Количество", total: "Всего",
    defects: "дефектов", cases: "тест-кейсов", currentDefects: "Текущие дефекты", currentCases: "Текущие кейсы",
    new: "Новые за период", all: "Все дефекты", linked: "Только со ссылками", allTypes: "Все типы",
    project: "Проект", component: "Продукт", assignee: "Исполнитель", status: "Статус", priority: "Приоритет",
    severity: "Серьёзность", type: "Тип", noRecords: "Нет подходящих записей", close: "Закрыть записи",
    coverage: (shown: string, total: string) => `${shown} из ${total} групп`,
  },
};
