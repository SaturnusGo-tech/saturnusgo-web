import { useState } from "react";
import { PiArrowBendDownRightDuotone } from "react-icons/pi";
import { Modal } from "../../../presentation/common/modal/Modal";
import { ParentFolderPicker } from "../../../presentation/dialogs/folder/parent/ParentFolderPicker";
import { FolderBreadcrumb } from "../../../presentation/dialogs/folder/breadcrumb/FolderBreadcrumb";
import type { FolderResource } from "../../model/folder";
import shared from "../../../tms.module.css";
import css from "../styles/dialog.module.css";

export function MoveCasesDialog({ resource, ids, ru, onClose, onMoved }: {
  resource: FolderResource; ids: readonly string[]; ru: boolean; onClose: () => void; onMoved: () => void;
}) {
  const [target, setTarget] = useState("/");
  const [error, setError] = useState("");
  const options = [{ value: "/", label: ru ? "Без папки" : "Unfiled" }, ...resource.items.filter((item) => !item.archivedAt).map((item) => ({ value: item.path, label: item.path }))];
  async function submit() {
    const folder = resource.items.find((item) => item.path === target && !item.archivedAt);
    if (target !== "/" && !folder) { setError(ru ? "Папка изменилась. Выберите место назначения ещё раз." : "Folder changed. Select a destination again."); return; }
    const result = await resource.moveCases(ids, folder?.id ?? null);
    if (result.ok) { onMoved(); onClose(); } else setError(result.message);
  }
  return <Modal title={ru ? "Переместить кейсы" : "Move test cases"} onClose={() => { if (!resource.busy) onClose(); }} panelClassName={css.dialog}>
    <div className={css.body}>
      <p>{ru ? `Выбрано кейсов: ${ids.length}. История, связи и результаты прогонов сохранятся.` : `${ids.length} cases selected. History, links and run results stay with each case.`}</p>
      <label className={css.label}>{ru ? "Куда переместить" : "Destination"}</label>
      <ParentFolderPicker inline value={target} options={options} label={ru ? "Папка назначения" : "Destination folder"}
        searchLabel={ru ? "Найти папку" : "Find folder"} emptyLabel={ru ? "Папки не найдены" : "No matching folders"} onChange={setTarget} />
      <div className={css.destination}><PiArrowBendDownRightDuotone size={20} /><span><FolderBreadcrumb path={target} root={ru ? "Без папки" : "Unfiled"} /></span></div>
      {error && <p role="alert" className={css.error}>{error}</p>}
    </div>
    <footer className={css.footer}><button className={shared.textButton} disabled={resource.busy} onClick={onClose}>{ru ? "Отмена" : "Cancel"}</button>
      <button className={shared.primaryButton} disabled={resource.busy || !resource.canManage} onClick={() => void submit()}>{resource.busy ? (ru ? "Перемещение…" : "Moving…") : (ru ? "Переместить" : "Move")}</button></footer>
  </Modal>;
}
