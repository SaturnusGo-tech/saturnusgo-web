import { Popover, PopoverContent } from "@heroui/popover";
import { FolderVisual } from "../appearance/visual/FolderVisual";
import { FolderAppearanceControl } from "../appearance/control/FolderAppearanceControl";
import { useId, useRef, useState } from "react";
import { PiArrowCounterClockwise, PiArchiveDuotone, PiCaretRight, PiFilePlusDuotone, PiFolderPlusDuotone, PiPencilSimple, PiX } from "react-icons/pi";
import { FolderBreadcrumb } from "../../../presentation/dialogs/folder/breadcrumb/FolderBreadcrumb";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import css from "./folder-actions.module.css";

export function FolderActionsDialog({ id, folder, trigger, resource, ru, onClose, onCreateCase, onCreateFolder, onManageFolder }: {
  id?: string; folder: RepositoryFolder; trigger: HTMLButtonElement; resource: FolderResource; ru: boolean; onClose: () => void;
  onCreateCase: (path: string) => void;
  onCreateFolder?: (folderId: string) => void;
  onManageFolder?: (folderId: string) => void;
}) {
  const [action, setAction] = useState<"menu" | "archive">("menu");
  const triggerRef = useRef(trigger);
  const titleId = useId();
  return <Popover triggerRef={triggerRef} isOpen placement="right-start" offset={8} disableAnimation
    isDismissable={!resource.busy} isKeyboardDismissDisabled={resource.busy}
    onOpenChange={open => { if (!open && !resource.busy) onClose(); }}
    classNames={{ content: css.dialog }} style={{ zIndex: 155 }}>
    <></>
    <PopoverContent id={id} aria-labelledby={titleId}>
      <header className={css.header}>
        <h2 id={titleId}>{action === "archive" ? (ru ? "Архивировать папку?" : "Archive folder?") : folder.name}</h2>
        <button type="button" className={css.close} disabled={resource.busy} onClick={onClose} aria-label={ru ? "Закрыть" : "Close"}><PiX size={14} /></button>
      </header>
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
            <button type="button" onClick={() => { onClose(); onCreateCase(folder.path); }}><PiFilePlusDuotone />{ru ? "Новый тест-кейс" : "New test case"}</button>
            <button type="button" disabled={!onCreateFolder || resource.busy} onClick={() => {
              if (!onCreateFolder || resource.busy) return;
              onClose(); onCreateFolder(folder.id);
            }}><PiFolderPlusDuotone />{ru ? "Новая подпапка" : "New subfolder"}</button>
          </div>
          <div className={css.group} role="group" aria-label={ru ? "Настройки папки" : "Folder settings"}>
            <div className={css.appearance}><FolderAppearanceControl folder={resource.items.find(item => item.id === folder.id) ?? folder} editable={resource.canManage} disabled={resource.busy} ru={ru} labelled /></div>
            <button type="button" disabled={!onManageFolder || resource.busy || resource.loading || !resource.canManage} onClick={() => {
              if (!onManageFolder || resource.busy || resource.loading || !resource.canManage) return;
              onClose(); onManageFolder(folder.id);
            }}><PiPencilSimple />{ru ? "Название и расположение" : "Name and location"}<PiCaretRight className={css.chevron} aria-hidden="true" /></button>
          </div>
          <div className={css.group}>
            <button type="button" className={css.archive} disabled={resource.busy} onClick={() => setAction("archive")}><PiArchiveDuotone />{ru ? "Архивировать папку" : "Archive folder"}</button>
          </div>
        </>}
      </div>}
      {resource.error && <p role="alert" className={css.error}>{resource.error}</p>}
    </PopoverContent>
  </Popover>;
}
