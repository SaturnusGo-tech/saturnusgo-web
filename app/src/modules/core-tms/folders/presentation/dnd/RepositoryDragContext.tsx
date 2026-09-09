import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useRef, useState, type ReactNode } from "react";
import { PiFilesDuotone } from "react-icons/pi";
import { dragCaseIds } from "../../model/tree";
import type { FolderResource } from "../../model/folder";
import css from "../styles/repository.module.css";
import { DragClickContext } from "./drag-click";

export function RepositoryDragContext({ children, resource, selected, ru, locked }: {
  children: ReactNode; resource: FolderResource; selected: ReadonlySet<string>; ru: boolean; locked: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 260, tolerance: 6 } }));
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const suppressUntil = useRef(0);
  async function finish(event: DragEndEvent) {
    setLabel(""); suppressUntil.current = Date.now() + 350;
    if (locked || !resource.canManage || !event.over) return;
    const target = event.over.data.current?.folderId as string | null | undefined;
    if (target === undefined) return;
    if (event.active.data.current?.kind === "case") {
      const result = await resource.moveCases(dragCaseIds(String(event.active.data.current.caseId), selected), target);
      if (!result.ok) setError(result.message);
    } else {
      const folder = resource.items.find((item) => item.id === event.active.data.current?.folderId);
      const destination = resource.items.find((item) => item.id === target);
      if (!folder || folder.id === target || destination?.path.startsWith(`${folder.path}/`)) return;
      if (!await resource.update(folder, { parentId: target })) setError(ru ? "Папка не перемещена. Обновите дерево." : "Folder was not moved. Refresh the tree.");
    }
  }
  return <DragClickContext.Provider value={suppressUntil}><DndContext sensors={sensors}
    onDragStart={({ active }) => {
      setError("");
      const count = active.data.current?.kind === "case" ? dragCaseIds(String(active.data.current.caseId), selected).length : 0;
      setLabel(count ? (ru ? `Кейсы: ${count}` : `${count} cases`) : String(active.data.current?.name ?? ""));
    }} onDragCancel={() => { setLabel(""); suppressUntil.current = Date.now() + 350; }} onDragEnd={(event) => void finish(event)}>
    {children}
    <DragOverlay dropAnimation={null}>{label && <div className={css.dragPreview}><PiFilesDuotone size={20} />{label}</div>}</DragOverlay>
    {error && <div className={css.errorToast} role="alert">{error}<button onClick={() => setError("")} aria-label={ru ? "Закрыть" : "Dismiss"}>×</button></div>}
  </DndContext></DragClickContext.Provider>;
}
