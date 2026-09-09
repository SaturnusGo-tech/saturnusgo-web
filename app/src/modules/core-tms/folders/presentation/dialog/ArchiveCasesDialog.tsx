import { useState } from "react";
import { Modal } from "../../../presentation/common/modal/Modal";
import type { FolderResource } from "../../model/folder";
import shared from "../../../tms.module.css";
import css from "../styles/dialog.module.css";

export function ArchiveCasesDialog({ resource, ids, ru, onClose, onArchived }: {
  resource: FolderResource; ids: readonly string[]; ru: boolean; onClose: () => void; onArchived: () => void;
}) {
  const [error, setError] = useState("");
  return <Modal title={ru ? "Архивировать выбранные кейсы?" : "Archive selected cases?"} onClose={() => { if (!resource.busy) onClose(); }} panelClassName={css.dialog}>
    <div className={css.body}><p>{ru ? `Кейсы (${ids.length}) исчезнут из рабочего списка. Их история и результаты прогонов сохранятся. Восстановить кейсы можно из архива.` : `${ids.length} cases will leave the working list. Their history and run results remain available. Archived cases can be restored.`}</p>
      {error && <p role="alert" className={css.error}>{error}</p>}</div>
    <footer className={css.footer}><button className={shared.textButton} disabled={resource.busy} onClick={onClose}>{ru ? "Отмена" : "Cancel"}</button>
      <button className={shared.primaryButton} disabled={resource.busy} onClick={async () => {
        const result = await resource.archiveCases(ids); if (result.ok) { onArchived(); onClose(); } else setError(result.message);
      }}>{ru ? "Архивировать" : "Archive"}</button></footer>
  </Modal>;
}
