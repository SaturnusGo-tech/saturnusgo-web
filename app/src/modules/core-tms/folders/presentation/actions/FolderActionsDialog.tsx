import { FolderVisual } from "../appearance/visual/FolderVisual";
import { FolderAppearanceControl } from "../appearance/control/FolderAppearanceControl";
import { useState } from "react";
import { PiArrowCounterClockwise, PiArchiveDuotone, PiCaretRight, PiFilePlusDuotone, PiFolderPlusDuotone, PiPencilSimple } from "react-icons/pi";
import { FolderBreadcrumb } from "../../../presentation/dialogs/folder/breadcrumb/FolderBreadcrumb";
import { Modal } from "../../../presentation/common/modal/Modal";
import { FolderDialog } from "../../../presentation/dialogs/folder/FolderDialog";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import { validFolderDestinations } from "../../model/tree";
import css from "./folder-actions.module.css";

export function FolderActionsDialog({ folder, resource, ru, onClose, onCreateCase, onCreated, onCreateFolder }: {
  folder: RepositoryFolder; resource: FolderResource; ru: boolean; onClose: () => void;
  onCreateCase: (path: string) => void; onCreated: (path: string, id?: string) => void;
  onCreateFolder?: (folderId: string) => void;
}) {
  const [action, setAction] = useState<"menu" | "edit" | "archive">("menu");
  if (action === "edit") return <FolderDialog
    existing={validFolderDestinations(resource.items, folder).map(item => item.path)}
    selectedParent={resource.items.find(item => item.id === folder.parentId)?.path ?? "/"}
    initialName={folder.name} editing busy={resource.busy} error={resource.error}
    onClose={onClose} onCreated={async (path) => {
      const parts = path.split("/").filter(Boolean); const name = parts.pop()!;
      const parentPath = `/${parts.join("/")}`;
      const parent = resource.items.find((item) => item.path === parentPath && !item.archivedAt);
      if (await resource.update(folder, { name, parentId: parent?.id ?? null })) { onCreated(path, folder.id); onClose(); }
    }} />;
  return <Modal title={action === "archive" ? (ru ? "Архивировать папку?" : "Archive folder?") : folder.name}
    onClose={() => { if (!resource.busy) onClose(); }} panelClassName={css.dialog}>
    <div className={css.context}>
      <span className={css.folder}><FolderVisual folderId={folder.id} /></span>
      <FolderBreadcrumb path={folder.path} />
      {folder.archivedAt && <span className={css.badge}>{ru ? "В архиве" : "Archived"}</span>}
    </div>
    {action === "archive" ? <div className={css.confirmation}>
      <p>{ru ? "Папка, вложенные папки и их кейсы будут отправлены в архив. История и прогоны сохранятся. Эту ветку можно восстановить целиком." : "This folder, its subfolders and cases will be archived. History and runs are preserved. You can restore the whole branch."}</p>
      <div className={css.footer}>
        <button type="button" disabled={resource.busy} onClick={() => setAction("menu")}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="button" className={css.primary} disabled={resource.busy} onClick={async () => { if (await resource.archive(folder)) onClose(); }}>{ru ? "Архивировать папку" : "Archive folder"}</button>
      </div>
    </div> : <div className={css.actions}>
          {folder.archivedAt ? <button type="button" disabled={resource.busy} onClick={async () => { if (await resource.restore(folder)) onClose(); }}><PiArrowCounterClockwise />{ru ? "Восстановить папку" : "Restore folder"}</button> : <>
            <div className={css.group} role="group" aria-label={ru ? "Создать в папке" : "Create in folder"}>
            <button onClick={() => { onClose(); onCreateCase(folder.path); }}><PiFilePlusDuotone />{ru ? "Новый тест-кейс" : "New test case"}</button>
            <button disabled={!onCreateFolder || resource.busy} onClick={() => {
              if (!onCreateFolder || resource.busy) return;
              onClose(); onCreateFolder(folder.id);
            }}><PiFolderPlusDuotone />{ru ? "Новая подпапка" : "New subfolder"}</button>
            </div>
            <div className={css.group} role="group" aria-label={ru ? "Настройки папки" : "Folder settings"}>
              <div className={css.appearance}><FolderAppearanceControl folder={resource.items.find(item => item.id === folder.id) ?? folder} editable={resource.canManage} disabled={resource.busy} ru={ru} labelled /></div>
              <button type="button" disabled={resource.busy} onClick={() => setAction("edit")}><PiPencilSimple />{ru ? "Название и расположение" : "Name and location"}<PiCaretRight className={css.chevron} aria-hidden="true" /></button>
            </div>
            <div className={css.group}>
              <button type="button" className={css.archive} disabled={resource.busy} onClick={() => setAction("archive")}><PiArchiveDuotone />{ru ? "Архивировать папку" : "Archive folder"}</button>
            </div>
          </>}
        </div>}
    {resource.error && <p role="alert" className={css.error}>{resource.error}</p>}
  </Modal>;
}
