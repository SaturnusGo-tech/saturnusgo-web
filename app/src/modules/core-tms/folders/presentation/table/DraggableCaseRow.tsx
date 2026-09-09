import { useDraggable } from "@dnd-kit/core";
import { useContext, type ComponentProps } from "react";
import { DragClickContext } from "../dnd/drag-click";

export function DraggableCaseRow({ caseId, dragEnabled, ...props }: ComponentProps<"tr"> & { caseId: string; dragEnabled: boolean }) {
  const drag = useDraggable({ id: `list-case:${caseId}`, data: { kind: "case", caseId }, disabled: !dragEnabled });
  const suppress = useContext(DragClickContext);
  return <tr {...drag.listeners} {...props} ref={drag.setNodeRef}
    style={{ ...props.style, opacity: drag.isDragging ? .35 : undefined }}
    onClick={(event) => { if (Date.now() > suppress.current) props.onClick?.(event); }} />;
}
