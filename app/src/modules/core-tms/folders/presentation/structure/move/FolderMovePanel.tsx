import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import { PiArrowsDownUp, PiFolderSimple, PiX } from "react-icons/pi";
import type { RepositoryFolder } from "../../../model/folder";
import { buildFolderTree } from "../../../model/tree";
import { folderMovePlan } from "../../../model/structure/folder-move";
import type { FolderStructureEditing } from "../../../state/structure/editing/useFolderStructureEditing";
import { FolderDestinationBranch } from "./FolderDestinationBranch";
import css from "./move.module.css";

export function FolderMovePanel({ folders, editing, disabled, ru }: {
  folders: readonly RepositoryFolder[]; editing: FolderStructureEditing; disabled: boolean; ru: boolean;
}) {
  const rootValid = folderMovePlan(editing.selected, null, folders).valid;
  return <section className={css.panel} aria-label={ru ? "Перемещение папок" : "Move folders"} aria-busy={editing.saving}>
    <header className={css.heading}><PiArrowsDownUp size={16} aria-hidden="true" /><div>
      <h2>{ru ? "Куда переместить папки?" : "Where should these folders go?"}</h2>
      <p>{ru ? "Вложенная структура сохранится." : "Subfolders keep their structure."}</p></div>
      <button className={css.close} type="button" disabled={editing.saving} onClick={editing.closeMove} aria-label={ru ? "Отменить перемещение" : "Cancel folder move"}><PiX size={16} /></button></header>
    <div className={css.destinations} role="group" aria-label={ru ? "Расположение" : "Destination"}>
      <button className={css.destination} type="button" aria-pressed={editing.destination === null} disabled={disabled || !rootValid}
        onClick={() => editing.chooseDestination(null)}><PiFolderSimple size={17} aria-hidden="true" /><span>{ru ? "Корень репозитория" : "Repository root"}</span></button>
      <ul className={css.tree}>{buildFolderTree(folders, []).roots.map(node => <FolderDestinationBranch key={node.folder.id} node={node}
        folders={folders} editing={editing} disabled={disabled} ru={ru} />)}</ul>
    </div>
    <ErrorToast message={editing.error} />
    <footer className={css.footer}><span>{ru ? `Папок: ${editing.count}` : `${editing.count} folder${editing.count === 1 ? "" : "s"}`}</span>
      <button type="button" className={css.cancel} disabled={editing.saving} onClick={editing.closeMove}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="button" className={css.confirm} disabled={disabled || !editing.canMove} onClick={() => void editing.move()}>
        {editing.saving ? (ru ? "Перемещение…" : "Moving…") : (ru ? "Переместить" : "Move folders")}</button></footer>
  </section>;
}
