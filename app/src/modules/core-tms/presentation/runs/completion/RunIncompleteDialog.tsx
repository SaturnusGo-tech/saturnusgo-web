import { Modal } from "../../common/modal/Modal";
import css from "./completion.module.css";
export function RunIncompleteDialog({ ru, busy, canArchive, onClose, onArchive }: {
  ru: boolean; busy: boolean; canArchive: boolean; onClose: () => void; onArchive: () => void;
}) {
  return <Modal title={ru ? "Остались кейсы без результата" : "Some cases have no result"}
    onClose={() => { if (!busy) onClose(); }} panelClassName={css.panel}>
    <p className={css.text}>{ru ? "Продолжите проверку или остановите и архивируйте прогон. Результаты сохранятся, отсчёт времени остановится. Прогон можно восстановить из архива." : "Continue testing or stop and archive this run. Results are preserved and the clock stops. The run can be restored from the archive."}</p>
    <div className={css.actions}><button type="button" disabled={busy} onClick={onClose}>{ru ? "Продолжить проверку" : "Continue testing"}</button>
      {canArchive && <button type="button" className={css.primary} disabled={busy} onClick={onArchive}>{ru ? "Остановить и архивировать" : "Stop and archive"}</button>}</div>
  </Modal>;
}
