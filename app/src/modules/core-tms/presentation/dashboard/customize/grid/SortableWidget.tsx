import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/react";
import { Check, Ellipsis, GripVertical, X } from "lucide-react";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { BoardWidget } from "../../../../dashboards/layout/model/layout";
import { dashboardcnEnabled, widgetByKey, widgetKey, widgetLayoutWidth } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useWidgetRows } from "./measurement/useWidgetRows";
import dashboardStyles from "../../dashboard.module.css";
import styles from "../layout.module.css";

const widgetWidths = [[3, "dashboardLayout.small"], [6, "dashboardLayout.medium"], [12, "dashboardLayout.large"]] as const;

export function SortableWidget({ widget, title, editing, disabled, alignRows, onRemove, onResize, children }: {
  widget: BoardWidget; title: string; editing: boolean; disabled: boolean; alignRows: boolean;
  onRemove?: (id: string) => void; onResize: (id: string, width: number) => void; children: ReactNode;
}) {
  const { t } = useTmsLocale(); const reduced = useReducedMotion();
  const measured = useWidgetRows(!alignRows);
  const metric = widgetByKey.get(widgetKey(widget))?.width === 3;
  const canResize = !metric || dashboardcnEnabled();
  const width = widgetLayoutWidth(widget);
  const sortable = useSortable({ id: widget.id, disabled: !editing || disabled,
    animateLayoutChanges: (args) => !reduced && defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
    transition: reduced ? null : { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" } });
  const name = { name: title };
  const menuLabel = t("dashboardLayout.widgetOptions", name);
  return <div ref={(node) => { sortable.setNodeRef(node); measured.ref(node); }} className={styles.widget}
    data-widget-id={widget.id} data-widget-title={title} data-widget-width={width} data-widget-kind={metric ? "metric" : "panel"}
    data-widget-editing={editing || undefined} data-dragging={sortable.isDragging || undefined}
    style={{ "--widget-span": width, gridRowEnd: alignRows ? undefined : `span ${measured.rows}`, transform: CSS.Translate.toString(sortable.transform),
      transition: sortable.transition } as CSSProperties}>
    {editing && <div className={styles.widgetTools} data-widget-actions role="group" aria-label={menuLabel}>
      <button type="button" ref={sortable.setActivatorNodeRef} {...sortable.attributes} {...sortable.listeners}
        className={styles.dragHandle} disabled={disabled} aria-label={t("dashboardLayout.move", name)} title={t("dashboardLayout.move", name)}><GripVertical size={15} /></button>
      {(canResize || onRemove) && <Dropdown disableAnimation placement="bottom-end" offset={4} classNames={{ content: `${styles.widgetMenu} ${dashboardStyles.popupEnter}` }}>
        <DropdownTrigger><Button type="button" size="sm" variant="light" isIconOnly disableRipple
          isDisabled={disabled || sortable.isDragging} aria-label={menuLabel}><Ellipsis size={16} aria-hidden="true" /></Button></DropdownTrigger>
        <DropdownMenu aria-label={menuLabel} itemClasses={{ base: styles.widgetMenuItem }}>
          {canResize ? <DropdownSection aria-label={t("dashboardLayout.size", name)} showDivider={Boolean(onRemove)}>
            {widgetWidths.map(([size, label]) => <DropdownItem key={size} aria-current={size === width || undefined}
              endContent={size === width && <Check size={14} aria-hidden="true" />}
              onPress={() => onResize(widget.id, size)}>{t(label)}</DropdownItem>)}
          </DropdownSection> : null}
          {onRemove ? <DropdownItem key="remove" onPress={() => onRemove(widget.id)}
            startContent={<X size={14} aria-hidden="true" />}>{t("dashboardLayout.removeWidget")}</DropdownItem> : null}
        </DropdownMenu>
      </Dropdown>}
    </div>}
    <div className={styles.widgetContent} data-widget-content inert={editing}>{children}</div>
  </div>;
}
