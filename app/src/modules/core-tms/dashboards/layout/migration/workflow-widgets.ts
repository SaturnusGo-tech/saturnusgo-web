import type { BoardWidget } from "../model/layout";
import { widgetByKey, widgetCatalog, widgetKey, type WidgetDefinition } from "../model/widget-catalog";

const families = new Map<string, string>([
  ["freshness", "queue"], ["readyForRetest", "queue"],
  ["currentDefects", "defectPerformance"], ["reportedDefects", "defects"], ["linkedDefects", "defects"],
  ["currentCases", "types"], ["casesCreated", "types"],
]);
const family = (key: string) => families.get(key) ?? (key.startsWith("defect:") ? "defects" : key.startsWith("type:") ? "types" : key);
const overrides: Partial<Record<string, Partial<WidgetDefinition>>> = {
  queue: { ru: "Очередь QA", en: "QA queue", width: 12,
    hintRu: "Разбор дефектов и сигналы, требующие внимания", hintEn: "Defect triage and checks that need attention" },
  defects: { ru: "Карта дефектов", en: "Defect map",
    hintRu: "Статусы, связи с трекерами и новые дефекты", hintEn: "Statuses, tracker links and newly reported defects" },
  types: { ru: "Состав тестовой базы", en: "Test library mix",
    hintRu: "Типы тест-кейсов во всей базе и за период", hintEn: "Case types in the library and in the selected period" },
  completedRuns: { ru: "Лента завершённых прогонов", en: "Completed runs timeline", width: 12,
    hintRu: "Результаты по датам и список прогонов", hintEn: "Outcomes by date and the runs behind each count" },
};

const performance: WidgetDefinition = {
  key: "defectPerformance", type: "defects", group: "history", width: 12,
  ru: "Динамика дефектов", en: "Defect performance",
  hintRu: "Открытые дефекты, срок решения и статусы за период",
  hintEn: "Open bugs, lead time and reports in the selected period",
};

export const workflowCatalog = [...widgetCatalog.filter(def => family(def.key) === def.key)
  .map(def => overrides[def.key] ? { ...def, ...overrides[def.key] } : def), performance];
const workflowDefinitions = new Map(workflowCatalog.map(def => [def.key, def]));
export const workflowDefinition = (key: string) => workflowDefinitions.get(key) ?? widgetByKey.get(key);

export function collapseWorkflowWidgets(widgets: BoardWidget[]): BoardWidget[] {
  const exact = new Map(widgets.map(widget => [widgetKey(widget), widget]));
  const upgraded = new Set(widgets.filter(widget => family(widgetKey(widget)) !== widgetKey(widget))
    .map(widget => family(widgetKey(widget))));
  const seen = new Set<string>();
  return widgets.flatMap(widget => {
    const key = widgetKey(widget);
    const canonical = family(key);
    if (seen.has(canonical)) return [];
    seen.add(canonical);
    const representative = exact.get(canonical) ?? widget;
    const definition = workflowDefinitions.get(canonical);
    const compactTimeline = canonical === "completedRuns" && representative.position.height === 1;
    if (!definition || (!upgraded.has(canonical) && !compactTimeline)) return [representative];
    return [{ ...representative, title: definition.en, type: definition.type,
      position: { ...representative.position, width: definition.width, height: Math.max(representative.position.height, 3) },
      settings: { ...representative.settings, presentation: canonical } }];
  });
}
