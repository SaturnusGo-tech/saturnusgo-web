import { useState, type ReactNode } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, MeasuringStrategy, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useReducedMotion } from "framer-motion";
import type { BoardWidget } from "../../../../dashboards/layout/model/layout";
import { widgetByKey, widgetKey } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { SortableWidget } from "./SortableWidget";
import { widgetCollisions } from "./collision/widgetCollisions";
import styles from "../layout.module.css";

export function WidgetGrid({ widgets, editing, disabled, onMove, onRemove, onResize, render }: {
  widgets: BoardWidget[]; editing: boolean; disabled: boolean;
  onMove: (id: string, index: number) => void; onRemove: (id: string) => void; onResize: (id: string, width: number) => void;
  render: (widget: BoardWidget, title: string) => ReactNode;
}) {
  const { locale, t } = useTmsLocale(); const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const title = (widget: BoardWidget) => { const definition = widgetByKey.get(widgetKey(widget));
    return definition ? locale === "ru" ? definition.ru : definition.en : widget.title; };
  const name = (id: string | number) => { const widget = widgets.find((item) => item.id === String(id)); return widget ? title(widget) : String(id); };
  return <DndContext sensors={sensors} collisionDetection={widgetCollisions} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    accessibility={{ screenReaderInstructions: { draggable: t("dashboardLayout.dragHelp") }, announcements: {
      onDragStart: ({active}) => t("dashboardLayout.picked", {name:name(active.id)}),
      onDragOver: ({active,over}) => over ? t("dashboardLayout.dropped",{name:name(active.id),position:widgets.findIndex(w=>w.id===over.id)+1}) : undefined,
      onDragEnd: ({active,over}) => over ? t("dashboardLayout.dropped",{name:name(active.id),position:widgets.findIndex(w=>w.id===over.id)+1}) : t("dashboardLayout.dragCancelled"),
      onDragCancel: () => t("dashboardLayout.dragCancelled"),
    } }}
    onDragStart={({ active }) => setActiveId(String(active.id))} onDragCancel={() => setActiveId(null)}
    onDragEnd={({ active, over }) => { setActiveId(null); if (over && active.id !== over.id) onMove(String(active.id),widgets.findIndex(item=>item.id===over.id)); }}>
    <SortableContext items={widgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
      <div className={styles.grid}>{widgets.map((widget) => <SortableWidget key={widget.id} widget={widget} title={title(widget)}
        editing={editing} disabled={disabled} onResize={onResize} onRemove={onRemove}>
        {render(widget,title(widget))}
      </SortableWidget>)}</div>
    </SortableContext>
    <DragOverlay dropAnimation={reduced ? null : {duration:220,easing:"cubic-bezier(.2,.8,.2,1)"}}>
      {activeId && <div className={styles.dragPreview}>{name(activeId)}</div>}
    </DragOverlay>
  </DndContext>;
}
