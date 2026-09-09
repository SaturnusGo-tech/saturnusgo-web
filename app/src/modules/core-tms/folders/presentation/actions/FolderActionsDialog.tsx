import { useState } from "react";
import { PiArrowCounterClockwise, PiArchiveDuotone, PiFilePlusDuotone, PiFolderPlusDuotone, PiPencilSimple } from "react-icons/pi";
import { Modal } from "../../../presentation/common/modal/Modal";
import { FolderDialog } from "../../../presentation/dialogs/folder/FolderDialog";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import { validFolderDestinations } from "../../model/tree";
import shared from "../../../tms.module.css";
import css from "../styles/dialog.module.css";

export function FolderActionsDialog({ folder, resource, ru, onClose, onCreateCase, onCreated }: {
  folder: RepositoryFolder; resource: FolderResource; ru: boolean; onClose: () => void;
  onCreateCase: (path: string) => void; onCreated: (path: string, id?: string) => void;
}) {
  const [action, setAction] = useState<"menu" | "edit" | "create" | "archive">("menu");
  if (action === "edit" || action === "create") return <FolderDialog
    existing={(action === "edit" ? validFolderDestinations(resource.items, folder) : resource.items.filter((item) => !item.archivedAt)).map((item) => item.path)}
    selectedParent={action === "create" ? folder.path : (resource.items.find((item) => item.id === folder.parentId)?.path ?? "/")}
    initialName={action === "edit" ? folder.name : undefined} editing={action === "edit"} busy={resource.busy} error={resource.error}
    onClose={onClose} onCreated={async (path) => {
      const parts = path.split("/").filter(Boolean); const name = parts.pop()!;
      const parentPath = `/${parts.join("/")}`;
      const parent = resource.items.find((item) => item.path === parentPath && !item.archivedAt);
      if (action === "edit") { if (await resource.update(folder, { name, parentId: parent?.id ?? null })) { onCreated(path, folder.id); onClose(); } }
      else { const result = await resource.create(name, parent?.id ?? null); if (result) { onCreated(result.path, result.id); onClose(); } }
    }} />;
  return <Modal title={folder.name} onClose={() => { if (!resource.busy) onClose(); }} panelClassName={css.dialog}>
    <div className={css.body}>
      <p>{folder.path.split("/").filter(Boolean).join(" / ")}</p>
      {action === "archive" ? <><p>{ru ? "Папка, вложенные папки и их кейсы будут отправлены в архив. История и прогоны сохранятся. Эту ветку можно восстановить целиком." : "This folder, its subfolders and cases will be archived. History and runs are preserved. You can restore the whole branch."}</p>
        <button className={shared.primaryButton} disabled={resource.busy} onClick={async () => { if (await resource.archive(folder)) onClose(); }}>{ru ? "Архивировать папку" : "Archive folder"}</button></>
        : <div className={css.actions}>
          {folder.archivedAt ? <button disabled={resource.busy} onClick={async () => { if (await resource.restore(folder)) onClose(); }}><PiArrowCounterClockwise />{ru ? "Восстановить папку" : "Restore folder"}</button> : <>
            <button onClick={() => { onClose(); onCreateCase(folder.path); }}><PiFilePlusDuotone />{ru ? "Новый тест-кейс" : "New test case"}</button>
            <button onClick={() => setAction("create")}><PiFolderPlusDuotone />{ru ? "Новая подпапка" : "New subfolder"}</button>
            <button onClick={() => setAction("edit")}><PiPencilSimple />{ru ? "Название и расположение" : "Name and location"}</button>
            <button onClick={() => setAction("archive")}><PiArchiveDuotone />{ru ? "Архивировать папку" : "Archive folder"}</button>
          </>}
        </div>}
      {resource.error && <p role="alert" className={css.error}>{resource.error}</p>}
    </div>
  </Modal>;
}
