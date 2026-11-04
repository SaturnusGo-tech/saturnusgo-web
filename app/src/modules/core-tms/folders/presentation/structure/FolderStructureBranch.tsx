import { FolderAppearanceControl } from "../appearance/control/FolderAppearanceControl";
import { useContext, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { PiCaretDown, PiCaretRight, PiPlus } from "react-icons/pi";
import type { FolderNode } from "../../model/tree";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { InlineFolderForm } from "../creation/InlineFolderForm";
import { DragClickContext, RepositoryDragSelectionContext } from "../dnd/drag-click";
import type { FolderStructureEditing } from "../../state/structure/editing/useFolderStructureEditing";
import { FolderRenameField } from "./editing/FolderRenameField";
import { useFolderDropReveal } from "../branch/hover/useFolderDropReveal";
import css from "./structure.module.css";

export function FolderStructureBranch({ node, collapsed, creation, disabled, busy, ru, onToggle, onAppearanceOpen, editing: actions, onRename }: {
  node: FolderNode; collapsed: ReadonlySet<string>; creation: RepositoryCreation; disabled: boolean; busy: boolean; ru: boolean;
  onToggle: (id: string) => void; onAppearanceOpen?: () => void; editing: FolderStructureEditing; onRename: (id: string) => void;
}) {
  const { folder, children } = node, open = !collapsed.has(folder.id), editing = creation.activeFolderId === folder.id;
  const trigger = useRef<HTMLButtonElement>(null), childrenId = `folder-structure-children-${folder.id}`;
  const name = useRef<HTMLButtonElement>(null), suppressClick = useContext(DragClickContext), moving = useContext(RepositoryDragSelectionContext);
  const renaming = actions.renamingId === folder.id;
  const drag = useDraggable({ id: `drag-folder:${folder.id}`, data: { kind: "folder", folderId: folder.id, name: folder.name }, disabled: disabled || renaming || actions.selecting });
  const drop = useDroppable({ id: `structure-folder:${folder.id}`, data: { folderId: folder.id }, disabled: disabled || Boolean(actions.renamingId) || actions.selecting });
  useFolderDropReveal(drop.isOver && moving.active, open, folder.id, id => { if (!open) onToggle(id); });
  function restoreNameFocus() { requestAnimationFrame(() => name.current?.focus({ preventScroll: true })); }
  return <li className={css.branch} data-structure-folder={folder.id}>
    <div ref={drop.setNodeRef} className={css.row} data-drop={drop.isOver || undefined} data-selected={actions.selected.has(folder.id) || undefined}
      data-dragging={moving.folderId === folder.id || undefined} data-repository-drag-row data-repository-drag-id={`drag-folder:${folder.id}`}>
      {actions.selecting && <input type="checkbox" className={css.checkbox} checked={actions.selected.has(folder.id)} disabled={disabled}
        aria-label={`${ru ? "Выбрать папку" : "Select folder"} ${folder.path}`} onChange={() => actions.toggleSelected(folder.id)} />}
      {children.length > 0 ? <button type="button" className={css.disclosure} disabled={busy} aria-expanded={open} aria-controls={childrenId}
        aria-label={`${open ? (ru ? "Свернуть" : "Collapse") : (ru ? "Раскрыть" : "Expand")} ${folder.name}`} onClick={() => onToggle(folder.id)}>
        {open ? <PiCaretDown size={12} /> : <PiCaretRight size={12} />}</button> : <span className={css.disclosure} aria-hidden="true" />}
      <FolderAppearanceControl folder={folder} open={open && !!children.length} editable={!disabled || busy} disabled={disabled} ru={ru} onOpen={onAppearanceOpen} />
      {renaming ? <FolderRenameField folder={folder} editing={actions} disabled={disabled} ru={ru} restoreFocus={restoreNameFocus} />
        : <button type="button" className={css.name} ref={element => { name.current = element; drag.setNodeRef(element); }} {...drag.attributes} {...drag.listeners}
          disabled={disabled} aria-label={actions.selecting
            ? `${actions.selected.has(folder.id) ? (ru ? "Снять выбор папки" : "Deselect folder") : (ru ? "Выбрать папку" : "Select folder")} ${folder.path}`
            : `${ru ? "Переименовать" : "Rename"} ${folder.name}`} aria-pressed={actions.selecting ? actions.selected.has(folder.id) : undefined} onClick={() => {
            if (Date.now() < suppressClick.current || disabled) return;
            actions.selecting ? actions.toggleSelected(folder.id) : onRename(folder.id);
          }}>{folder.name}</button>}
      <span className={css.count} aria-label={`${ru ? "Подпапок" : "Subfolders"}: ${children.length}`}>{children.length}</span>
      <button ref={trigger} type="button" className={css.add} disabled={disabled}
        aria-label={`${ru ? "Добавить подпапку в" : "Add subfolder to"} ${folder.path}`} title={ru ? "Добавить подпапку" : "Add subfolder"}
        onClick={() => { if (!disabled) creation.begin(folder.id); }}><PiPlus size={14} aria-hidden="true" /></button>
    </div>
    <div className={css.branchChildren} hidden={!open}>
      <ul id={childrenId} className={css.children}>
        {editing && <li className={css.draft}><InlineFolderForm parentId={folder.id} parentName={folder.name} creation={creation} disabled={disabled} ru={ru}
          restoreFocus={() => requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }))} /></li>}
        {children.map(child => <FolderStructureBranch key={child.folder.id} node={child} collapsed={collapsed} creation={creation}
          disabled={disabled} busy={busy} ru={ru} onToggle={onToggle} onAppearanceOpen={onAppearanceOpen} editing={actions} onRename={onRename} />)}
      </ul>
    </div>
  </li>;
}

export function FolderStructureRootDrop({ disabled, ru }: { disabled: boolean; ru: boolean }) {
  const moving = useContext(RepositoryDragSelectionContext);
  const drop = useDroppable({ id: "structure-root", data: { folderId: null }, disabled });
  return <div ref={drop.setNodeRef} className={css.rootDrop} data-visible={moving.active || undefined} data-drop={drop.isOver || undefined}
    aria-hidden={!moving.active}>{ru ? "Переместить в корень репозитория" : "Move to repository root"}</div>;
}
