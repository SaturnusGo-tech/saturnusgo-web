import { useState } from "react";
import { PiCaretDown, PiCaretRight, PiCheck } from "react-icons/pi";
import type { RepositoryFolder } from "../../../model/folder";
import type { FolderNode } from "../../../model/tree";
import { folderMovePlan } from "../../../model/structure/folder-move";
import type { FolderStructureEditing } from "../../../state/structure/editing/useFolderStructureEditing";
import { FolderVisual } from "../../appearance/visual/FolderVisual";
import css from "./move.module.css";

export function FolderDestinationBranch({ node, folders, editing, disabled, ru }: {
  node: FolderNode; folders: readonly RepositoryFolder[]; editing: FolderStructureEditing; disabled: boolean; ru: boolean;
}) {
  const [open, setOpen] = useState(false), valid = folderMovePlan(editing.selected, node.folder.id, folders).valid;
  const selected = editing.destination === node.folder.id;
  return <li><div className={css.destinationRow}>
    {node.children.length ? <button className={css.expand} type="button" disabled={disabled} aria-expanded={open}
      aria-label={`${open ? (ru ? "Свернуть" : "Collapse") : (ru ? "Раскрыть" : "Expand")} ${node.folder.name}`} onClick={() => setOpen(value => !value)}>
      {open ? <PiCaretDown size={11} /> : <PiCaretRight size={11} />}</button> : <span className={css.expand} />}
    <button className={css.destination} type="button" disabled={disabled || !valid} aria-pressed={selected}
      aria-label={`${ru ? "Переместить в" : "Move to"} ${node.folder.path}`} onClick={() => editing.chooseDestination(node.folder.id)}>
      <FolderVisual folderId={node.folder.id} appearance={node.folder.appearance} /><span>{node.folder.name}</span>{selected && <PiCheck size={13} />}
    </button></div>
    {open && <ul className={css.children}>{node.children.map(child => <FolderDestinationBranch key={child.folder.id} node={child} folders={folders}
      editing={editing} disabled={disabled} ru={ru} />)}</ul>}
  </li>;
}
