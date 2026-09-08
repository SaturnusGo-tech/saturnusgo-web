import type { components } from "../../../../../core/tms/generated/tms-api";

type Wire = components["schemas"];
export type WidgetType = Wire["DashboardWidgetType"];
export type BoardWidget = {
  id: string; type: WidgetType; title: string;
  position: { x: number; y: number; width: number; height: number };
  settings: Record<string, unknown>;
};
export type BoardDraft = { name: string; widgets: BoardWidget[] };
export type ProjectBoard = BoardDraft & { id: string; projectId: string; workspaceId: string; etag: string };
export type BoardScope = { workspaceId: string; projectId: string };
export type LayoutFailure = "permission" | "conflict" | "unavailable" | "invalid";
export class LayoutError extends Error {
  constructor(readonly kind: LayoutFailure) { super(kind); }
}
export interface LayoutSource {
  load(scope: BoardScope, signal: AbortSignal): Promise<ProjectBoard | null>;
  save(scope: BoardScope, current: ProjectBoard | null, draft: BoardDraft, key: string): Promise<ProjectBoard>;
}
export type LayoutState = {
  loading: boolean; saving: boolean; board: ProjectBoard | null;
  draft: BoardDraft | null; failure: LayoutFailure | null; retryPending: boolean;
};
export function placeWidgets(widgets: readonly BoardWidget[]): BoardWidget[] {
  let x = 0; let y = 0; let rowHeight = 0;
  return widgets.map((widget) => {
    const width = Math.min(12, Math.max(3, widget.position.width));
    if (x + width > 12) { x = 0; y += rowHeight; rowHeight = 0; }
    const next = { ...widget, position: { x, y, width, height: widget.position.height } };
    rowHeight = Math.max(rowHeight, widget.position.height);
    x += width;
    if (x === 12) { x = 0; y += rowHeight; rowHeight = 0; }
    return next;
  });
}
export function moveWidget(widgets: readonly BoardWidget[], id: string, target: number): BoardWidget[] {
  const from = widgets.findIndex((widget) => widget.id === id);
  if (from < 0 || target < 0 || target >= widgets.length) return [...widgets];
  const next = [...widgets]; next.splice(target, 0, next.splice(from, 1)[0]);
  return placeWidgets(next);
}
