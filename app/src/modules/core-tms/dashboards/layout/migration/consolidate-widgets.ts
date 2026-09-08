import { placeWidgets, type BoardWidget } from "../model/layout";
import { widgetKey } from "../model/widget-catalog";
export const freshnessLegacyKeys = new Set(["activeRuns", "blockedItems", "openDefects", "notRunItems", "inProgressItems", "outdatedItems", "runsWithoutBuild"]);
/** Upgrade the presentation without replacing board IDs, ETags or unrelated settings. */
export function consolidateWidgets(widgets: BoardWidget[]): BoardWidget[] {
  if (!widgets.some(widget => freshnessLegacyKeys.has(widgetKey(widget)))) return widgets;
  let hasFreshness = widgets.some(widget => widgetKey(widget) === "freshness");
  return placeWidgets(widgets.flatMap(widget => {
    if (!freshnessLegacyKeys.has(widgetKey(widget))) return [widgetKey(widget) === "freshness"
      ? { ...widget, position: { ...widget.position, width: 3 } } : widget];
    if (hasFreshness) return [];
    hasFreshness = true;
    return [{ ...widget, type: "recent_activity" as const, title: "Актуальность проверок",
      settings: { ...widget.settings, presentation: "freshness" },
      position: { ...widget.position, width: 3, height: 3 } }];
  }));
}
