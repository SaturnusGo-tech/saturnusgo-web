import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useContext, useRef, type CSSProperties } from "react";
import { PiCaretDown, PiCaretRight, PiDotsThree, PiFolderDuotone, PiFolderOpenDuotone } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { FolderNode } from "../../model/tree";
import type { RepositoryFolder } from "../../model/folder";
import { RepositoryCaseLeaf } from "../case/RepositoryCaseLeaf";
import { DragClickContext } from "../dnd/drag-click";
import css from "../styles/repository.module.css";

export type FolderBranchProps = {
  node: FolderNode; depth: number; expanded: ReadonlySet<string>; selected: ReadonlySet<string>;
  selectedFolder: string; selectedFolderId?: string; activeCaseId: string; ru: boolean; locked: boolean; canManage: boolean;
  onExpand: (id: string) => void; onFolder: (path: string, id?: string) => void; onCase: (item: TestCaseSummary) => void;
  onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void; onMenu: (folder: RepositoryFolder) => void;
};

export function RepositoryFolderBranch(props: FolderBranchProps) {
  const { node, depth, ru } = props;
  const folder = node.folder;
  const open = props.expanded.has(folder.id);
  const checkbox = useRef<HTMLInputElement>(null);
  const selectedCount = node.caseIds.filter((id) => props.selected.has(id)).length;
  const drop = useDroppable({ id: `folder:${folder.id}`, data: { folderId: folder.id }, disabled: props.locked || !props.canManage || Boolean(folder.archivedAt) });
  const drag = useDraggable({ id: `drag-folder:${folder.id}`, data: { kind: "folder", folderId: folder.id, name: folder.name }, disabled: props.locked || !props.canManage || Boolean(folder.archivedAt) });
  const suppress = useContext(DragClickContext);
  return <li>
    <div ref={drop.setNodeRef} className={css.folderRow} data-selected={(props.selectedFolderId ? props.selectedFolderId === folder.id : !folder.archivedAt && props.selectedFolder === folder.path) || undefined}
      data-drop={drop.isOver || undefined} style={{ "--depth": depth, opacity: drag.isDragging ? .4 : 1 } as CSSProperties}>
      <button type="button" className={css.disclosure} aria-expanded={open} aria-label={`${open ? (ru ? "Свернуть" : "Collapse") : (ru ? "Раскрыть" : "Expand")} ${folder.name}`}
        onClick={() => props.onExpand(folder.id)}>{open ? <PiCaretDown /> : <PiCaretRight />}</button>
      <input type="checkbox" ref={(element) => { checkbox.current = element; if (element) element.indeterminate = selectedCount > 0 && selectedCount < node.caseIds.length; }}
        checked={node.caseIds.length > 0 && selectedCount === node.caseIds.length} disabled={props.locked || !props.canManage || !node.caseIds.length || Boolean(folder.archivedAt)}
        aria-label={`${ru ? "Выбрать кейсы папки" : "Select folder cases"} ${folder.name}`} onChange={() => props.onScope(node.caseIds)} />
      <button ref={drag.setNodeRef} {...drag.attributes} {...drag.listeners} type="button" className={css.folderName} title={folder.path}
        disabled={props.locked} aria-disabled={props.locked || undefined}
        onClick={() => { if (!props.locked && Date.now() > suppress.current) { props.onFolder(folder.path, folder.id); if (!open) props.onExpand(folder.id); } }}>
        {open ? <PiFolderOpenDuotone size={19} /> : <PiFolderDuotone size={19} />}<span>{folder.name}</span><small>{node.caseIds.length}</small>
      </button>
      <button type="button" className={css.menuButton} disabled={props.locked || !props.canManage} onClick={() => props.onMenu(folder)} aria-label={`${ru ? "Действия с папкой" : "Folder actions"} ${folder.name}`}><PiDotsThree size={19} /></button>
    </div>
    {open && <ul className={css.children}>
      {node.children.map((child) => <RepositoryFolderBranch key={child.folder.id} {...props} node={child} depth={depth + 1} />)}
      {node.cases.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={depth + 1} selected={props.selected.has(item.id)} active={props.activeCaseId === item.id}
        locked={props.locked} canManage={props.canManage} ru={ru} onToggle={props.onToggle} onOpen={props.onCase} />)}
      {!node.caseIds.length && !node.children.length && <li className={css.emptyFolder} style={{ paddingLeft: 42 + depth * 16 }}>{ru ? "Папка пуста" : "Empty folder"}</li>}
    </ul>}
  </li>;
}
