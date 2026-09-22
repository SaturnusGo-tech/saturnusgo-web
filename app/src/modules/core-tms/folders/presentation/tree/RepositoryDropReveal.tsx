import { useDndMonitor } from "@dnd-kit/core";

/** Mounted only during a repository drag, inside its DndContext. */
export function RepositoryDropReveal({ onReveal }: { onReveal: (id: string) => void }) {
  useDndMonitor({ onDragEnd: ({ over }) => {
    const id = over?.data.current?.folderId;
    if (typeof id === "string") onReveal(id);
  } });
  return null;
}
