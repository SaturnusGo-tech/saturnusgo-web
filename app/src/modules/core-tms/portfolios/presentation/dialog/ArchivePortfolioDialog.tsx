import { formatTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { Modal } from "../../../presentation/common/modal/Modal";
import { FormError } from "../../../presentation/common/error/FormError";
import type { PortfolioCopy } from "../../model/copy";
import styles from "../styles/dialog.module.css";

export function ArchivePortfolioDialog({ copy, pending, error, onConfirm, onClose }: { copy: PortfolioCopy; pending: boolean; error: TmsMutationFailure | null; onConfirm: () => Promise<void>; onClose: () => void }) {
  return <Modal title={copy.archiveTitle} onClose={onClose} panelClassName={styles.panel}>
    <div className={styles.body}><p className={styles.note}>{copy.archiveHint}</p>{error && <FormError message={formatTmsMutationFailure(error, copy.saveError)} />}</div>
    <footer className={styles.footer}><button type="button" onClick={onClose}>{copy.cancel}</button>
      <button type="button" className={styles.primary} disabled={pending} onClick={() => void onConfirm()}>{pending ? copy.saving : copy.archive}</button>
    </footer>
  </Modal>;
}
