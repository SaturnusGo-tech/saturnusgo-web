import type { ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, MeasuringStrategy, useSensor, useSensors, type Modifier } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { BoardWidget } from "../../../../dashboards/layout/model/layout";
import { widgetByKey, widgetKey } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { SortableWidget } from "./SortableWidget";
import { widgetCollisions } from "./collision/widgetCollisions";
import styles from "../layout.module.css";

const keepPointerDragInView: Modifier = ({ activatorEvent, draggingNodeRect, scrollableAncestorRects, transform, windowRect }) => {
  const bounds = scrollableAncestorRects[0] ?? windowRect;
  if (activatorEvent?.type !== "pointerdown" || !draggingNodeRect || !bounds) return transform;

  // Keep the full widget on screen when it fits. Pointer-based drop targeting
  // and vertical edge scrolling continue to follow the pointer.
  const clampOffset = (offset: number, min: number, max: number) =>
    min <= max ? Math.min(Math.max(max, 0), Math.max(Math.min(min, 0), offset)) : offset;
  return {
    ...transform,
    x: clampOffset(transform.x, bounds.left - draggingNodeRect.left, bounds.right - draggingNodeRect.right),
    y: clampOffset(transform.y, bounds.top - draggingNodeRect.top, bounds.bottom - draggingNodeRect.bottom),
  };
};

const widgetModifiers = [keepPointerDragInView];

export function WidgetGrid({ widgets, editing, disabled, onMove, onRemove, onResize, render }: {
  widgets: BoardWidget[]; editing: boolean; disabled: boolean;
  onMove: (id: string, index: number) => void; onRemove?: (id: string) => void; onResize: (id: string, width: number) => void;
  render: (widget: BoardWidget, title: string) => ReactNode;
}) {
  const { locale, t } = useTmsLocale();
  const alignRows = widgets.every(widget => ["queue", "freshness", "readyForRetest"].includes(widgetKey(widget)));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const title = (widget: BoardWidget) => { const definition = widgetByKey.get(widgetKey(widget));
    return definition ? locale === "ru" ? definition.ru : definition.en : widget.title; };
  const name = (id: string | number) => { const widget = widgets.find((item) => item.id === String(id)); return widget ? title(widget) : String(id); };
  return <DndContext sensors={sensors} modifiers={widgetModifiers} collisionDetection={widgetCollisions} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    accessibility={{ screenReaderInstructions: { draggable: t("dashboardLayout.dragHelp") }, announcements: {
      onDragStart: ({active}) => t("dashboardLayout.picked", {name:name(active.id)}),
      onDragOver: ({active,over}) => over ? t("dashboardLayout.dropped",{name:name(active.id),position:widgets.findIndex(w=>w.id===over.id)+1}) : undefined,
      onDragEnd: ({active,over}) => over ? t("dashboardLayout.dropped",{name:name(active.id),position:widgets.findIndex(w=>w.id===over.id)+1}) : t("dashboardLayout.dragCancelled"),
      onDragCancel: () => t("dashboardLayout.dragCancelled"),
    } }}
    onDragEnd={({ active, over }) => {
      if (over && active.id !== over.id) onMove(String(active.id), widgets.findIndex(item => item.id === over.id));
    }}>
    <SortableContext items={widgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
      <div className={styles.grid} data-align-rows={alignRows}>{widgets.map((widget) => <SortableWidget key={widget.id} widget={widget} title={title(widget)}
        editing={editing} disabled={disabled} alignRows={alignRows} onResize={onResize} onRemove={onRemove}>
        {render(widget,title(widget))}
      </SortableWidget>)}</div>
    </SortableContext>
  </DndContext>;
}
