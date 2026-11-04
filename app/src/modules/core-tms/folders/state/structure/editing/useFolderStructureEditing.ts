import { useEffect, useRef, useState } from "react";
import type { FolderResource, RepositoryFolder } from "../../../model/folder";
import { folderMovePlan, selectionRoots } from "../../../model/structure/folder-move";

export function useFolderStructureEditing(resource: FolderResource, folders: readonly RepositoryFolder[], locked: boolean, ru: boolean) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false), [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [moveOpen, setMoveOpen] = useState(false), [destination, setDestination] = useState<string | null>(null);
  const [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const pending = useRef(false), mounted = useRef(true);
  const latest = useRef({ resource, folders }); latest.current = { resource, folders };
  const disabled = locked || !resource.canManage || resource.loading || resource.busy;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function beginRename(id: string) {
    if (disabled || pending.current || !folders.some(folder => folder.id === id && !folder.archivedAt)) return;
    setRenamingId(id); setMoveOpen(false); setError(""); setNotice("");
  }
  function cancelRename() { if (!pending.current) { setRenamingId(null); setError(""); } }
  async function saveName(id: string, value: string) {
    const folder = folders.find(item => item.id === id && !item.archivedAt), name = value.trim();
    if (disabled || pending.current || !folder || !name) return false;
    if (name === folder.name) { cancelRename(); return true; }
    pending.current = true; setSaving(true); setError("");
    try {
      const ok = await resource.update(folder, { name });
      if (mounted.current && latest.current.folders.some(item => item.id === folder.id && item.workspaceId === folder.workspaceId && item.projectId === folder.projectId)) {
        if (ok) { setRenamingId(null); setNotice(ru ? `Папка «${name}» переименована.` : `Folder “${name}” renamed.`); }
        else setError(ru ? "Не удалось переименовать папку. Попробуйте ещё раз." : "Could not rename the folder. Please try again.");
      }
      return ok;
    } catch {
      if (mounted.current) setError(ru ? "Не удалось переименовать папку. Попробуйте ещё раз." : "Could not rename the folder. Please try again.");
      return false;
    } finally { pending.current = false; if (mounted.current) setSaving(false); }
  }
  function toggleSelecting() {
    if (disabled || pending.current) return;
    setSelecting(value => !value); setSelected(new Set()); setMoveOpen(false); cancelRename(); setNotice("");
  }
  function toggleSelected(id: string) {
    if (disabled || pending.current || !folders.some(folder => folder.id === id && !folder.archivedAt)) return;
    setSelected(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
    setError("");
  }
  function openMove() {
    if (disabled || pending.current || !selected.size) return;
    setMoveOpen(true); setDestination(null); setError(""); cancelRename();
  }
  function closeMove() { if (!pending.current) { setMoveOpen(false); setError(""); } }
  async function move() {
    const plan = folderMovePlan(selected, destination, folders);
    if (disabled || pending.current || !moveOpen || !plan.valid) return;
    pending.current = true; setSaving(true); setError(""); setNotice("");
    const failed = new Set<string>(); let moved = 0;
    const scope = plan.folders[0];
    try {
      for (const folder of plan.folders) {
        const current = latest.current;
        const source = current.folders.find(item => item.id === folder.id && !item.archivedAt);
        if (!mounted.current || !current.resource.canManage || !source || source.workspaceId !== scope.workspaceId || source.projectId !== scope.projectId ||
          !folderMovePlan(new Set([folder.id]), destination, current.folders).valid) { failed.add(folder.id); continue; }
        try { if (await current.resource.update(source, { parentId: destination })) moved++; else failed.add(folder.id); }
        catch { failed.add(folder.id); }
      }
      if (mounted.current && latest.current.folders.some(item => item.workspaceId === scope.workspaceId && item.projectId === scope.projectId)) {
        setSelected(failed);
        if (!failed.size) { setMoveOpen(false); setSelecting(false); }
        else setError(ru ? `Не перемещено папок: ${failed.size}. Выберите место и повторите.` : `${failed.size} folder${failed.size === 1 ? " was" : "s were"} not moved. Choose a destination and retry.`);
        if (moved) setNotice(ru ? `Перемещено папок: ${moved}.` : `${moved} folder${moved === 1 ? "" : "s"} moved.`);
      }
    } finally { pending.current = false; if (mounted.current) setSaving(false); }
  }
  return { renamingId, selecting, selected, moveOpen, destination, saving, error, notice,
    count: selectionRoots(selected, folders).length,
    canMove: folderMovePlan(selected, destination, folders).valid,
    beginRename, cancelRename, saveName, toggleSelecting, toggleSelected, openMove, closeMove, move,
    chooseDestination(id: string | null) { if (!disabled && !pending.current) setDestination(id); },
  };
}
export type FolderStructureEditing = ReturnType<typeof useFolderStructureEditing>;
