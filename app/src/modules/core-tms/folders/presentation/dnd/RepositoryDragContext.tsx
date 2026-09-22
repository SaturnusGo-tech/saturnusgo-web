import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PiFilesDuotone, PiFolderSimpleDuotone } from "react-icons/pi";
import { canDropRepositoryDrag, repositoryDrag, type RepositoryDrag } from "../../model/drag/repository-drop";
import type { FolderResource } from "../../model/folder";
import css from "./styles/drag.module.css";
import { DragClickContext, RepositoryDragSelectionContext } from "./drag-click";

const emptySelection = { active: false, caseIds: new Set<string>(), folderId: null };
export function RepositoryDragContext({ children, resource, selected, ru, locked }: {
  children: ReactNode; resource: FolderResource; selected: ReadonlySet<string>; ru: boolean; locked: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 260, tolerance: 6 } }));
  const [drag, setDrag] = useState<RepositoryDrag | null>(null);
  const [selection, setSelection] = useState<{ active: boolean; caseIds: ReadonlySet<string>; folderId: string | null }>(emptySelection);
  const [error, setError] = useState("");
  const gesture = useRef<{ id: string; drag: RepositoryDrag } | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const suppressUntil = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const disabled = locked || !resource.canManage || resource.busy || resource.loading;
  const collisionDetection: CollisionDetection = args => {
    if (disabled || pending.current) return [];
    const moving = gesture.current?.drag;
    return pointerWithin({ ...args, droppableContainers: args.droppableContainers.filter(target =>
      !target.disabled && canDropRepositoryDrag(moving ?? null, target.data.current?.folderId, resource.items)) });
  };
  function clear() {
    gesture.current = null; setDrag(null); setSelection(emptySelection); suppressUntil.current = Date.now() + 350;
  }
  async function finish(event: DragEndEvent) {
    const captured = gesture.current; clear();
    if (disabled || pending.current || !captured || captured.id !== String(event.active.id) || !event.over || event.over.disabled) return;
    const target = event.over.data.current?.folderId;
    if (!canDropRepositoryDrag(captured.drag, target, resource.items)) return;
    pending.current = true;
    try {
      let message = "";
      if (captured.drag.kind === "case") {
        const result = await resource.moveCases(captured.drag.ids, target);
        if (!result.ok) message = result.message;
      } else {
        const folderId = captured.drag.folderId;
        const folder = resource.items.find(item => item.id === folderId)!;
        if (!await resource.update(folder, { parentId: target })) message = ru ? "Папка не перемещена. Обновите дерево." : "Folder was not moved. Refresh the tree.";
      }
      if (mounted.current && message) setError(message);
    } catch {
      if (mounted.current) setError(ru ? "Не удалось переместить. Попробуйте ещё раз." : "Could not move. Please try again.");
    } finally { pending.current = false; }
  }
  const count = drag?.kind === "case" ? drag.ids.length : 0;
  const label = !drag ? "" : drag.kind === "folder" || count === 1 && drag.label ? drag.label
    : count > 1 ? (ru ? "Выбранные тест-кейсы" : "Selected test cases") : (ru ? "Тест-кейс" : "Test case");
  return <DragClickContext.Provider value={suppressUntil}><RepositoryDragSelectionContext.Provider value={selection}>
    <DndContext sensors={sensors} collisionDetection={collisionDetection}
      accessibility={{ screenReaderInstructions: { draggable: ru ? "Удерживайте строку и перетащите в папку. Escape отменяет перенос." : "Hold a row and drag it to a folder. Escape cancels the move." } }}
      onDragStart={({ active }) => {
        if (disabled || pending.current) return;
        const moving = repositoryDrag(active.data.current, selected, resource.items);
        if (!moving) return;
        gesture.current = { id: String(active.id), drag: moving };
        setError(""); setDrag(moving);
        setSelection({ active: true, caseIds: new Set(moving.kind === "case" ? moving.ids : []), folderId: moving.kind === "folder" ? moving.folderId : null });
      }} onDragCancel={clear} onDragEnd={event => void finish(event)}>
      {children}
      <DragOverlay dropAnimation={null}>{drag && <div className={css.dragPreview} data-stacked={count > 1 || undefined}>
        {drag.kind === "folder" ? <PiFolderSimpleDuotone size={18} /> : <PiFilesDuotone size={18} />}
        <span>{label}</span>{count > 1 && <b>{count}</b>}
      </div>}</DragOverlay>
      {error && <div className={css.errorToast} role="alert">{error}<button onClick={() => setError("")} aria-label={ru ? "Закрыть" : "Dismiss"}>×</button></div>}
    </DndContext></RepositoryDragSelectionContext.Provider></DragClickContext.Provider>;
}
