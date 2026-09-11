import { useDisclosureMotion } from "../../../presentation/common/disclosure/useDisclosureMotion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useContext, useRef, type ReactNode } from "react";
import { PiCaretDown, PiCaretRight, PiDotsThree, PiFolderSimpleDuotone, PiFolderOpenDuotone } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { FolderNode } from "../../model/tree";
import type { RepositoryFolder } from "../../model/folder";
import { RepositoryCaseLeaf } from "../case/RepositoryCaseLeaf";
import { DragClickContext } from "../dnd/drag-click";
import css from "../styles/repository.module.css";

export type FolderBranchProps = {
  trailing?: (item: TestCaseSummary) => ReactNode;
  canSelect?: boolean; allowArchivedSelection?: boolean; accessory?: (item: TestCaseSummary) => ReactNode;
  node: FolderNode; depth: number; expanded: ReadonlySet<string>; selected: ReadonlySet<string>;
  selectedFolder: string; selectedFolderId?: string; activeCaseId: string; ru: boolean; locked: boolean; canManage: boolean;
  onExpand: (id: string) => void; onFolder: (path: string, id?: string) => void; onCase: (item: TestCaseSummary) => void;
  onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void; onMenu: (folder: RepositoryFolder) => void;
};

export function RepositoryFolderBranch(props: FolderBranchProps) {
  const { node, depth, ru } = props;
  const folder = node.folder;
  const open = props.expanded.has(folder.id);
  const motion = useDisclosureMotion(open);
  const childrenId = `repository-children-${folder.id}`;
  const checkbox = useRef<HTMLInputElement>(null);
  const disclosure = useRef<HTMLButtonElement>(null);
  const selectedCount = node.selectableCaseIds.filter((id) => props.selected.has(id)).length;
  const drop = useDroppable({ id: `folder:${folder.id}`, data: { folderId: folder.id }, disabled: props.locked || !props.canManage || Boolean(folder.archivedAt) });
  const drag = useDraggable({ id: `drag-folder:${folder.id}`, data: { kind: "folder", folderId: folder.id, name: folder.name }, disabled: props.locked || !props.canManage || Boolean(folder.archivedAt) });
  const suppress = useContext(DragClickContext);
  return <li className={css.branch} data-depth={depth}>
    <div ref={drop.setNodeRef} className={css.folderRow} data-selected={(props.selectedFolderId ? props.selectedFolderId === folder.id : !folder.archivedAt && props.selectedFolder === folder.path) || undefined}
      data-drop={drop.isOver || undefined} style={{ opacity: drag.isDragging ? .4 : 1 }}>
      <button ref={disclosure} type="button" className={css.disclosure} aria-expanded={open} aria-controls={open ? childrenId : undefined}
        aria-label={`${open ? (ru ? "Свернуть" : "Collapse") : (ru ? "Раскрыть" : "Expand")} ${folder.name}`}
        onClick={() => props.onExpand(folder.id)}>{open ? <PiCaretDown /> : <PiCaretRight />}</button>
      <input type="checkbox" ref={(element) => { checkbox.current = element; if (element) element.indeterminate = selectedCount > 0 && selectedCount < node.selectableCaseIds.length; }}
        checked={node.selectableCaseIds.length > 0 && selectedCount === node.selectableCaseIds.length} disabled={props.locked || !(props.canSelect ?? props.canManage) || !node.selectableCaseIds.length || Boolean(folder.archivedAt)}
        aria-label={`${ru ? "Выбрать кейсы папки" : "Select folder cases"} ${folder.name}`} onChange={() => props.onScope(node.selectableCaseIds)} />
      <button ref={drag.setNodeRef} {...drag.attributes} {...drag.listeners} type="button" className={css.folderName} title={folder.name}
        disabled={props.locked} aria-disabled={props.locked || undefined}
        onClick={() => { if (!props.locked && Date.now() > suppress.current) { props.onFolder(folder.path, folder.id); if (!open) props.onExpand(folder.id); } }}>
        {open ? <PiFolderOpenDuotone size={18} /> : <PiFolderSimpleDuotone size={18} />}<span>{folder.name}</span><small>{node.caseIds.length}</small>
      </button>
      {props.canManage && <button type="button" className={css.menuButton} disabled={props.locked || !props.canManage} onClick={() => props.onMenu(folder)} aria-label={`${ru ? "Действия с папкой" : "Folder actions"} ${folder.name}`}><PiDotsThree size={19} /></button>}
    </div>
    {motion.present && <div ref={(element) => { motion.ref.current = element; if (element) element.inert = !open; }} className={css.branchChildren} aria-hidden={!open || undefined}>
      <button type="button" className={css.branchGuide} aria-expanded="true" aria-controls={childrenId}
        aria-label={`${ru ? "Свернуть ветку" : "Collapse branch"} ${folder.name}`}
        title={`${ru ? "Свернуть ветку" : "Collapse branch"} ${folder.name}`} onClick={() => { disclosure.current?.focus(); props.onExpand(folder.id); }} />
      <ul id={childrenId} className={css.children}>
      {node.children.map((child) => <RepositoryFolderBranch key={child.folder.id} {...props} node={child} depth={depth + 1} />)}
      {node.cases.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={depth + 1} selected={props.selected.has(item.id)} active={props.activeCaseId === item.id}
        trailing={props.trailing?.(item)} accessory={props.accessory?.(item)} locked={props.locked} canSelect={props.canSelect} allowArchivedSelection={props.allowArchivedSelection} canManage={props.canManage} ru={ru} onToggle={props.onToggle} onOpen={props.onCase} />)}
      {!node.caseIds.length && !node.children.length && <li className={css.emptyFolder}>{ru ? "Папка пуста" : "Empty folder"}</li>}
      </ul>
    </div>}
  </li>;
}
