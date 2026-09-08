import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import { GripVertical, X } from "lucide-react";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { BoardWidget } from "../../../../dashboards/layout/model/layout";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../layout.module.css";

export function SortableWidget({ widget, title, editing, disabled, onRemove, onResize, children }: {
  widget: BoardWidget; title: string; editing: boolean; disabled: boolean;
  onRemove: (id: string) => void; onResize: (id: string, width: number) => void; children: ReactNode;
}) {
  const { t } = useTmsLocale(); const reduced = useReducedMotion();
  const sortable = useSortable({ id: widget.id, disabled: !editing || disabled,
    animateLayoutChanges: (args) => !reduced && defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
    transition: reduced ? null : { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" } });
  const name = { name: title };
  return <div ref={sortable.setNodeRef} className={`${styles.widget} ${editing ? styles.editingWidget : ""}`}
    data-widget-id={widget.id} data-widget-title={title} data-widget-width={widget.position.width}
    style={{ "--widget-span": widget.position.width, transform: CSS.Translate.toString(sortable.transform),
      transition: sortable.transition, opacity: sortable.isDragging ? .3 : 1 } as CSSProperties}>
    {editing && <div className={styles.widgetTools}>
      <button type="button" ref={sortable.setActivatorNodeRef} {...sortable.attributes} {...sortable.listeners}
        className={styles.dragHandle} disabled={disabled} aria-label={t("dashboardLayout.move", name)} title={t("dashboardLayout.move", name)}><GripVertical size={16} /></button>
      <span title={title}>{title}</span>
      <AnimatedSelect compact className={styles.widthSelect} label={t("dashboardLayout.size", name)} value={String(widget.position.width)} disabled={disabled}
        onChange={(value) => onResize(widget.id, Number(value))} options={[
          {value:"3",label:t("dashboardLayout.small")},{value:"6",label:t("dashboardLayout.medium")},{value:"12",label:t("dashboardLayout.large")},
        ]} />
      <button type="button" disabled={disabled} onClick={() => onRemove(widget.id)} aria-label={t("dashboardLayout.remove",name)}><X size={14} /></button>
    </div>}
    <motion.div className={styles.widgetContent} initial={reduced ? false : { opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .18 }}
      ref={(element) => { if (element) element.inert = editing; }}>{children}</motion.div>
  </div>;
}
