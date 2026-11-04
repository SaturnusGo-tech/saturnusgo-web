import { FolderAppearanceControl } from "../appearance/control/FolderAppearanceControl";
import { useRef } from "react";
import { PiCaretDown, PiCaretRight, PiPlus } from "react-icons/pi";
import type { FolderNode } from "../../model/tree";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { InlineFolderForm } from "../creation/InlineFolderForm";
import css from "./structure.module.css";

export function FolderStructureBranch({ node, collapsed, creation, disabled, busy, ru, onToggle, onAppearanceOpen }: {
  node: FolderNode; collapsed: ReadonlySet<string>; creation: RepositoryCreation; disabled: boolean; busy: boolean; ru: boolean;
  onToggle: (id: string) => void; onAppearanceOpen?: () => void;
}) {
  const { folder, children } = node, open = !collapsed.has(folder.id), editing = creation.activeFolderId === folder.id;
  const trigger = useRef<HTMLButtonElement>(null), childrenId = `folder-structure-children-${folder.id}`;
  return <li className={css.branch} data-structure-folder={folder.id}>
    <div className={css.row}>
      {children.length > 0 ? <button type="button" className={css.disclosure} disabled={busy} aria-expanded={open} aria-controls={childrenId}
        aria-label={`${open ? (ru ? "Свернуть" : "Collapse") : (ru ? "Раскрыть" : "Expand")} ${folder.name}`} onClick={() => onToggle(folder.id)}>
        {open ? <PiCaretDown size={12} /> : <PiCaretRight size={12} />}</button> : <span className={css.disclosure} aria-hidden="true" />}
      <FolderAppearanceControl folder={folder} open={open && !!children.length} editable={!disabled || busy} disabled={disabled} ru={ru} onOpen={onAppearanceOpen} />
      <span className={css.name} title={folder.name}>{folder.name}</span>
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
          disabled={disabled} busy={busy} ru={ru} onToggle={onToggle} onAppearanceOpen={onAppearanceOpen} />)}
      </ul>
    </div>
  </li>;
}
