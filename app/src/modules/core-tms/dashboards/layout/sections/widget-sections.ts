import type { BoardWidget } from "../model/layout";
import { widgetKey } from "../model/widget-catalog";
export const dashboardSections = ["overview", "runs", "defects", "library"] as const;
export type DashboardSection = typeof dashboardSections[number];
export function widgetSection(key: string): DashboardSection {
  if (["queue", "readyForRetest", "freshness"].includes(key)) return "overview";
  if (["trend", "outcomes", "portfolio", "runsLaunched", "completedRuns", "passedRuns", "passRate"].includes(key)) return "runs";
  if (key.startsWith("defect:") || ["defects", "currentDefects", "reportedDefects", "linkedDefects"].includes(key)) return "defects";
  return "library";
}
export function sectionMoveTarget(widgets: BoardWidget[], section: DashboardSection, index: number): number {
  const target = widgets.filter(widget => widgetSection(widgetKey(widget)) === section)[index];
  return target ? widgets.findIndex(widget => widget.id === target.id) : -1;
}
export const sectionLabels = {
  overview: { ru: "Работа сейчас", en: "Work now", hintRu: "Прогоны, исправления и проверки, требующие внимания", hintEn: "Runs, fixes and checks that need attention" },
  runs: { ru: "Прогоны и риски", en: "Runs & risks", hintRu: "Результаты тестирования за выбранный период", hintEn: "Testing results for the selected period" },
  defects: { ru: "Дефекты", en: "Defects", hintRu: "Состояние дефектов и работа с исправлениями", hintEn: "Defect lifecycle and fix verification" },
  library: { ru: "Тестовая база", en: "Test library", hintRu: "Состав базы и пробелы в охвате прогонами", hintEn: "Library composition and gaps in run coverage" },
} as const;
